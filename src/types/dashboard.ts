export type DashboardStudentStat = {
  studentId: string;
  name?: string;
  total: number;
  present: number;
  score: number;
  percent: number;
};

export type DashboardOverview = {
  success: boolean;
  academicYear: number;
  years: number[];
  totalClasses: number;
  totalStudents: number;
  totalRecords: number;
  summary: { present: number; late: number; leave: number };
  average: { score: number; percent: number };
  riskStudents: DashboardStudentStat[];
  students: DashboardStudentStat[];
  recentActivity: {
    studentId: string;
    name: string;
    className: string;
    status: string;
    date: string;
    time: string;
  }[];
};

export type DashboardRanking = {
  success: boolean;
  totalStudents: number;
  ranking: {
    score: { top: DashboardStudentStat[]; bottom: DashboardStudentStat[] };
    percent: { top: DashboardStudentStat[]; bottom: DashboardStudentStat[] };
  };
};

export type DashboardWeeklyItem = {
  week: string;
  present: number;
  late: number;
  leave: number;
};
