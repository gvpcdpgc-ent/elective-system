import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Starting seeding...");

    // 1. Clean up existing data in correct dependency order
    await prisma.selection.deleteMany();
    await prisma.preference.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.electiveCategory.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();

    console.log("🧹 Cleared existing data.");

    // 2. Create Admin
    const password = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
        data: {
            username: 'admin',
            password,
            role: 'ADMIN',
        },
    });
    console.log("👤 Created Admin user.");

    // 3. Create Departments
    const deptsData = [
        { name: "CIVIL ENGINEERING", code: "CIVIL" },
        { name: "COMPUTER SCIENCE AND ENGINEERING", code: "CSE" },
        { name: "COMPUTER SCIENCE AND ENGINEERING (ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING)", code: "CSM" },
        { name: "ELECTRONICS AND COMMUNICATION ENGINEERING", code: "ECE" },
        { name: "MECHANICAL ENGINEERING", code: "MECHANICAL" },
    ];

    const departments: any[] = [];
    for (const d of deptsData) {
        const created = await prisma.department.create({
            data: d
        });
        departments.push(created);
    }
    console.log("🏢 Created 5 Departments.");

    // 4. Create Categories
    const categoriesData = [
        { name: "OPEN ELECTIVE - I", year: 3, semester: 1 },
        { name: "OPEN ELECTIVE - II", year: 3, semester: 2 },
        { name: "OPEN ELECTIVE - III", year: 4, semester: 1 },
        { name: "OPEN ELECTIVE - IV", year: 4, semester: 1 },
    ];

    const categories = [];
    for (const cat of categoriesData) {
        const createdCat = await prisma.electiveCategory.create({
            data: cat
        });
        categories.push(createdCat);
    }
    console.log("📁 Created Elective Categories (OPEN ELECTIVE - I to IV).");

    // 5. Create Subjects (exactly 1 subject per department per category)
    const subjectsMap: Record<string, Record<string, string>> = {
        "OPEN ELECTIVE - I": {
            CSE: "Fundamentals of Databases",
            CSM: "Introduction to Artificial Intelligence",
            ECE: "Basic Electronics",
            CIVIL: "Introduction to Infrastructure",
            MECHANICAL: "Mechanisms & Machines"
        },
        "OPEN ELECTIVE - II": {
            CSE: "Fundamentals of Software Engineering",
            CSM: "Data Science Foundations",
            ECE: "Microcontroller Applications",
            CIVIL: "Building Planning & CAD",
            MECHANICAL: "Fluid Power Systems"
        },
        "OPEN ELECTIVE - III": {
            CSE: "Web Application Development",
            CSM: "Machine Learning Projects",
            ECE: "Internet of Things Systems",
            CIVIL: "Disaster Management & Safety",
            MECHANICAL: "Robotics Engineering"
        },
        "OPEN ELECTIVE - IV": {
            CSE: "Cloud Computing Architectures",
            CSM: "Deep Learning Applications",
            ECE: "Embedded Systems Programming",
            CIVIL: "Environmental Management",
            MECHANICAL: "Renewable Energy Sources"
        }
    };

    let subjectCount = 0;
    for (const category of categories) {
        const catMap = subjectsMap[category.name];
        for (const [deptCode, name] of Object.entries(catMap)) {
            const dept = departments.find(d => d.code === deptCode);
            if (!dept) continue;

            const code = `OE-${category.name.split(' ').pop()}-${deptCode}`;
            await prisma.subject.create({
                data: {
                    name,
                    code,
                    description: `This open elective in ${name} is offered by the department of ${dept.name}.`,
                    limit: 50, // 50 seats per subject
                    departmentId: dept.id,
                    year: category.year,
                    categoryId: category.id
                }
            });
            subjectCount++;
        }
    }
    console.log(`📚 Created ${subjectCount} subjects (1 subject per department per category).`);

    // 6. Create Students
    const studentCounts = {
        CSE: 100,
        CSM: 40,
        ECE: 80,
        CIVIL: 40,
        MECHANICAL: 40,
    };

    const studentPassword = await bcrypt.hash('password123', 10);
    const students = [];

    for (const [deptCode, count] of Object.entries(studentCounts)) {
        const dept = departments.find(d => d.code === deptCode);
        if (!dept) continue;

        for (let i = 1; i <= count; i++) {
            // Assign 3rd or 4th year randomly
            const year = Math.random() > 0.5 ? 3 : 4;
            students.push({
                username: `${deptCode.toLowerCase()}_student_${i}`,
                password: studentPassword,
                role: "STUDENT",
                departmentId: dept.id,
                year: year,
            });
        }
    }

    // Batch insert students
    await prisma.user.createMany({
        data: students,
    });

    console.log(`🎓 Created ${students.length} students across all departments.`);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
