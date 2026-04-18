import {
  IconAdjustmentsHorizontal,
  IconBook,
  IconHistory,
  IconLayoutDashboard,
  IconReport,
  IconUsers,
} from '@tabler/icons-react'

export const data = {
  navMain: [
    {
      title: 'แดชบอร์ด',
      url: '/admin',
      icon: IconLayoutDashboard,
    },
    {
      title: 'ข้อมูลพนักงาน',
      url: '/admin/employees',
      icon: IconUsers,
    },
    {
      title: 'ข้อมูลหลักสูตร',
      url: '/admin/courses',
      icon: IconBook,
    },
    {
      title: 'บันทึกกิจกรรม',
      url: '/admin/activities',
      icon: IconHistory,
    },
  ],
  report: [
    {
      title: 'รายงานสรุป',
      url: '/admin/reports/summary',
      icon: IconReport,
    },
  ],
  setting: [
    {
      title: 'ผู้ใช้ในระบบ',
      url: '/admin/users',
      icon: IconUsers,
    },
    {
      title: 'ตั้งค่าระบบ',
      url: '/admin/settings',
      icon: IconAdjustmentsHorizontal,
    },
  ],
}
