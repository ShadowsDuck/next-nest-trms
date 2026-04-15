import { OrgUnitLevel } from '../../src/generated/prisma/client'
import { prisma } from '../../src/client'

type OrgSeedNode = {
  key: string
  name: string
  level: OrgUnitLevel
  parentKey: string | null
}

const orgSeedNodes: OrgSeedNode[] = [
  { key: 'plant-main', name: 'Plant Main', level: 'Plant', parentKey: null },

  { key: 'bu-auto', name: 'BU Automotive', level: 'BU', parentKey: 'plant-main' },
  { key: 'bu-elec', name: 'BU Electronics', level: 'BU', parentKey: 'plant-main' },

  { key: 'fn-prod', name: 'สายงานการผลิต', level: 'Function', parentKey: 'bu-auto' },
  { key: 'fn-supply', name: 'สายงานซัพพลายเชน', level: 'Function', parentKey: 'bu-elec' },

  { key: 'div-assembly', name: 'ฝ่ายประกอบ', level: 'Division', parentKey: 'fn-prod' },
  { key: 'div-quality', name: 'ฝ่ายคุณภาพ', level: 'Division', parentKey: 'fn-prod' },
  { key: 'div-logistics', name: 'ฝ่ายโลจิสติกส์', level: 'Division', parentKey: 'fn-supply' },

  { key: 'dep-assy-a', name: 'ส่วนงานประกอบ A', level: 'Department', parentKey: 'div-assembly' },
  { key: 'dep-assy-b', name: 'ส่วนงานประกอบ B', level: 'Department', parentKey: 'div-assembly' },
  { key: 'dep-qc-in', name: 'ส่วนงานตรวจสอบคุณภาพ', level: 'Department', parentKey: 'div-quality' },
  { key: 'dep-log-plan', name: 'ส่วนงานวางแผนขนส่ง', level: 'Department', parentKey: 'div-logistics' },
]

export async function seedOrganizationUnits() {
  console.log('🌱 Seeding organization units...')

  await prisma.organizationUnit.deleteMany()

  const idByKey = new Map<string, string>()

  for (const node of orgSeedNodes) {
    const parentId = node.parentKey ? idByKey.get(node.parentKey) ?? null : null

    if (node.parentKey && !parentId) {
      throw new Error(`Parent key not found while seeding organization unit: ${node.parentKey}`)
    }

    const created = await prisma.organizationUnit.create({
      data: {
        name: node.name,
        level: node.level,
        parentId,
      },
      select: { id: true },
    })

    idByKey.set(node.key, created.id)
  }

  console.log(`✅ Seeded ${orgSeedNodes.length} organization units`)
}

if (require.main === module) {
  seedOrganizationUnits()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
