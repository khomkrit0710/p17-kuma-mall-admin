
import { AdminRole, PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export async function POST(request:Request) {
    try {
        const { name, email, password, role } = await request.json()
        
        if (role && !Object.values(AdminRole).includes(role)) {
            return Response.json({
                error: `Invalid role. Must be one of: ${Object.values(AdminRole).join(', ')}`
            }, { status: 400 })
        }

        const hashedPassword = bcrypt.hashSync(password, 10)

        const newUser = await prisma.accountAdmin.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role as AdminRole
            }
        })
        return Response.json({
            massage: "create new admin success",
            data : { newUser }   
        })
    } catch (error) {
        return Response.json({
            error
        }, { status: 500 })
    }
}