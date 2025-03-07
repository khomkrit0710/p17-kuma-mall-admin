import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export async function GET(
    request: Request,
    { params } : { params: { id: string} }
) {
    const productId = Number(params.id)
    
    const post = await prisma.product.findUnique({
        where : {
            id: productId
        }
    })
    return Response.json(post)
}