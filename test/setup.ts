import prisma from "./prismaTestClient"
import { execSync } from "child_process"

beforeAll(() => {
    console.log('This part was called!!!')
})
beforeEach(() => {})
afterAll(() => {})