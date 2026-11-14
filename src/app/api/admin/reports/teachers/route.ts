import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Ambil data absensi khusus user dengan role TEACHER
    const teacherAttendances = await prisma.teacherAttendance.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            nip: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({ success: true, data: teacherAttendances });
  } catch (error) {
    console.error("Error fetching teacher reports:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data rekapan guru" },
      { status: 500 }
    );
  }
}