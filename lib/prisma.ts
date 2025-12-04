import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var prismaGlobalRefreshed: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobalRefreshed ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobalRefreshed = prisma
