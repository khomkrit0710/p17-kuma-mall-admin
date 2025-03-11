import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'superadmin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const admins = await prisma.accountAdmin.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const formattedAdmins = admins.map(admin => ({
            id: admin.id,
            username: admin.name || admin.email,
            email: admin.email,
            role: admin.role,
            createdAt: admin.createdAt
        }))
        
        return Response.json(formattedAdmins)
    } catch (error) {
        console.error('Error fetching admins:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'superadmin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const { username, password, role } = await request.json()
        
        if (!username || !password) {
            return Response.json({ error: 'Username and password are required' }, { status: 400 })
        }

        const validRole = role === 'SUPER_ADMIN' ? 'superadmin' : 'admin'
        
        const hashedPassword = await bcrypt.hash(password, 10)
        
        const newAdmin = await prisma.accountAdmin.create({
            data: {
                name: username,
                email: username,
                password: hashedPassword,
                role: validRole
            }
        })
        
        return Response.json({
            message: 'Admin created successfully',
            admin: {
                id: newAdmin.id,
                username: newAdmin.name || newAdmin.email,
                role: newAdmin.role
            }
        })
    } catch (error) {
        console.error('Error creating admin:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}