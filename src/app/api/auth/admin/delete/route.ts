import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'superadmin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 })
        }
        
        const { adminId } = await request.json()
        
        if (!adminId) {
            return Response.json({ error: 'Admin ID is required' }, { status: 400 })
        }

        if (adminId === session.user.id) {
            return Response.json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' }, { status: 400 })
        }

        const adminExists = await prisma.accountAdmin.findUnique({
            where: { id: adminId }
        })
        
        if (!adminExists) {
            return Response.json({ error: 'Admin not found' }, { status: 404 })
        }

        await prisma.accountAdmin.delete({
            where: { id: adminId }
        })
        
        return Response.json({ message: 'ลบผู้ดูแลระบบสำเร็จ' })
    } catch (error) {
        console.error('Error deleting admin:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}