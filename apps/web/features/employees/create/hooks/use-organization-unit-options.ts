'use client'

import { useEffect, useState } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { toast } from 'react-toastify'
import {
  createEmptyOrganizationHierarchyOptions,
  loadOrganizationHierarchyOptions,
  OrganizationHierarchyLoadError,
  type OrganizationOption,
} from '@/domains/org-units'
import type { CreateEmployeeForm } from '../schemas/form-schema'

type UseOrganizationUnitOptionsParams = {
  control: Control<CreateEmployeeForm>
  setValue: UseFormSetValue<CreateEmployeeForm>
}

type OrganizationUnitOptionsResult = {
  plantOptions: OrganizationOption[]
  buOptions: OrganizationOption[]
  functionOptions: OrganizationOption[]
  divisionOptions: OrganizationOption[]
  departmentOptions: OrganizationOption[]
  isOrgLoading: boolean
  selectedPlantId: string | undefined
  selectedBuId: string | undefined
  selectedFunctionId: string | undefined
  selectedDivisionId: string | undefined
}

export function useOrganizationUnitOptions({
  control,
  setValue: _setValue,
}: UseOrganizationUnitOptionsParams): OrganizationUnitOptionsResult {
  const [options, setOptions] = useState(() =>
    createEmptyOrganizationHierarchyOptions()
  )
  const [loadingCount, setLoadingCount] = useState(0)

  const selectedPlantId = useWatch({ control, name: 'plantId' })
  const selectedBuId = useWatch({ control, name: 'buId' })
  const selectedFunctionId = useWatch({ control, name: 'functionId' })
  const selectedDivisionId = useWatch({ control, name: 'divisionId' })

  useEffect(() => {
    let isActive = true

    // โหลดตัวเลือกหน่วยงานทั้งหมดตาม selection ปัจจุบันผ่าน seam ของ domain
    const loadOptions = async () => {
      setLoadingCount((current) => current + 1)

      try {
        const nextOptions = await loadOrganizationHierarchyOptions({
          plantId: selectedPlantId || undefined,
          buId: selectedBuId || undefined,
          functionId: selectedFunctionId || undefined,
          divisionId: selectedDivisionId || undefined,
        })

        if (isActive) {
          setOptions(nextOptions)
        }
      } catch (error) {
        if (isActive) {
          setOptions(
            error instanceof OrganizationHierarchyLoadError
              ? error.options
              : createEmptyOrganizationHierarchyOptions()
          )

          if (error instanceof OrganizationHierarchyLoadError) {
            const messageByLevel = {
              plants: 'โหลดรายการ Plant ไม่สำเร็จ',
              businessUnits: 'โหลดรายการ Business Unit ไม่สำเร็จ',
              functions: 'โหลดรายการ Function ไม่สำเร็จ',
              divisions: 'โหลดรายการ Division ไม่สำเร็จ',
              departments: 'โหลดรายการ Department ไม่สำเร็จ',
            } as const

            toast.error(messageByLevel[error.level])
          } else {
            toast.error('โหลดข้อมูลหน่วยงานไม่สำเร็จ')
          }
        }
      } finally {
        setLoadingCount((current) => Math.max(0, current - 1))
      }
    }

    void loadOptions()

    return () => {
      isActive = false
    }
  }, [selectedPlantId, selectedBuId, selectedFunctionId, selectedDivisionId])

  return {
    plantOptions: options.plantOptions,
    buOptions: options.buOptions,
    functionOptions: options.functionOptions,
    divisionOptions: options.divisionOptions,
    departmentOptions: options.departmentOptions,
    isOrgLoading: loadingCount > 0,
    selectedPlantId,
    selectedBuId,
    selectedFunctionId,
    selectedDivisionId,
  }
}
