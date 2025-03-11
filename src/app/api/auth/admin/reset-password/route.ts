import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'superadmin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const { adminId, password } = await request.json()
        
        if (!adminId || !password) {
            return Response.json({ error: 'Admin ID and password are required' }, { status: 400 })
        }

        const adminExists = await prisma.accountAdmin.findUnique({
            where: { id: adminId }
        })
        
        if (!adminExists) {
            return Response.json({ error: 'Admin not found' }, { status: 404 })
        }
        
        const hashedPassword = await bcrypt.hash(password, 10)
        
        await prisma.accountAdmin.update({
            where: { id: adminId },
            data: { password: hashedPassword }
        })
        
        return Response.json({ message: 'Password updated successfully' })
    } catch (error) {
        console.error('Error updating admin password:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}