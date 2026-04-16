'use client'

import { useEffect, useState } from 'react'
import type { OrganizationUnitResponse } from '@workspace/schemas'
import type { Control, UseFormSetValue } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import type { CreateEmployeeForm } from '@/features/new-employee/lib/create-employee-schema'
import {
  fetchOrganizationUnits,
  sortOrgUnitsByName,
} from '@/features/new-employee/lib/org-unit-api'

type UseOrganizationUnitOptionsParams = {
  control: Control<CreateEmployeeForm>
  setValue: UseFormSetValue<CreateEmployeeForm>
}

type OrganizationUnitOptionsResult = {
  plantOptions: OrganizationUnitResponse[]
  buOptions: OrganizationUnitResponse[]
  functionOptions: OrganizationUnitResponse[]
  divisionOptions: OrganizationUnitResponse[]
  departmentOptions: OrganizationUnitResponse[]
  isOrgLoading: boolean
  selectedPlantId: string | undefined
  selectedBuId: string | undefined
  selectedFunctionId: string | undefined
  selectedDivisionId: string | undefined
}

export function useOrganizationUnitOptions({
  control,
  setValue,
}: UseOrganizationUnitOptionsParams): OrganizationUnitOptionsResult {
  const [plantOptions, setPlantOptions] = useState<OrganizationUnitResponse[]>(
    []
  )
  const [buOptions, setBuOptions] = useState<OrganizationUnitResponse[]>([])
  const [functionOptions, setFunctionOptions] = useState<
    OrganizationUnitResponse[]
  >([])
  const [divisionOptions, setDivisionOptions] = useState<
    OrganizationUnitResponse[]
  >([])
  const [departmentOptions, setDepartmentOptions] = useState<
    OrganizationUnitResponse[]
  >([])
  const [loadingCount, setLoadingCount] = useState(0)

  const selectedPlantId = useWatch({ control, name: 'plantId' })
  const selectedBuId = useWatch({ control, name: 'buId' })
  const selectedFunctionId = useWatch({ control, name: 'functionId' })
  const selectedDivisionId = useWatch({ control, name: 'divisionId' })

  useEffect(() => {
    let isActive = true

    const loadPlants = async () => {
      setLoadingCount((current) => current + 1)

      try {
        const plants = await fetchOrganizationUnits(
          '/api/organization-units/plants'
        )

        if (isActive) {
          setPlantOptions(sortOrgUnitsByName(plants))
        }
      } catch {
        if (isActive) {
          toast.error('โหลดรายการ Plant ไม่สำเร็จ')
        }
      } finally {
        setLoadingCount((current) => Math.max(0, current - 1))
      }
    }

    loadPlants()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!selectedPlantId) {
      setBuOptions([])
      setValue('buId', '')
      setFunctionOptions([])
      setValue('functionId', '')
      setDivisionOptions([])
      setValue('divisionId', '')
      setDepartmentOptions([])
      setValue('departmentId', '')
      return
    }

    let isActive = true

    const loadBusinessUnits = async () => {
      setLoadingCount((current) => current + 1)

      try {
        const children = await fetchOrganizationUnits(
          `/api/organization-units/${encodeURIComponent(selectedPlantId)}/children`
        )

        if (isActive) {
          setBuOptions(
            sortOrgUnitsByName(children.filter((item) => item.level === 'BU'))
          )
        }
      } catch {
        if (isActive) {
          setBuOptions([])
          toast.error('โหลดรายการ Business Unit ไม่สำเร็จ')
        }
      } finally {
        setLoadingCount((current) => Math.max(0, current - 1))
      }
    }

    loadBusinessUnits()

    return () => {
      isActive = false
    }
  }, [selectedPlantId, setValue])

  useEffect(() => {
    if (!selectedBuId) {
      setFunctionOptions([])
      setValue('functionId', '')
      setDivisionOptions([])
      setValue('divisionId', '')
      setDepartmentOptions([])
      setValue('departmentId', '')
      return
    }

    let isActive = true

    const loadFunctions = async () => {
      setLoadingCount((current) => current + 1)

      try {
        const children = await fetchOrganizationUnits(
          `/api/organization-units/${encodeURIComponent(selectedBuId)}/children`
        )

        if (isActive) {
          setFunctionOptions(
            sortOrgUnitsByName(
              children.filter((item) => item.level === 'Function')
            )
          )
        }
      } catch {
        if (isActive) {
          setFunctionOptions([])
          toast.error('โหลดรายการ Function ไม่สำเร็จ')
        }
      } finally {
        setLoadingCount((current) => Math.max(0, current - 1))
      }
    }

    loadFunctions()

    return () => {
      isActive = false
    }
  }, [selectedBuId, setValue])

  useEffect(() => {
    if (!selectedFunctionId) {
      setDivisionOptions([])
      setValue('divisionId', '')
      setDepartmentOptions([])
      setValue('departmentId', '')
      return
    }

    let isActive = true

    const loadDivisions = async () => {
      setLoadingCount((current) => current + 1)

      try {
        const children = await fetchOrganizationUnits(
          `/api/organization-units/${encodeURIComponent(selectedFunctionId)}/children`
        )

        if (isActive) {
          setDivisionOptions(
            sortOrgUnitsByName(
              children.filter((item) => item.level === 'Division')
            )
          )
        }
      } catch {
        if (isActive) {
          setDivisionOptions([])
          toast.error('โหลดรายการ Division ไม่สำเร็จ')
        }
      } finally {
        setLoadingCount((current) => Math.max(0, current - 1))
      }
    }

    loadDivisions()

    return () => {
      isActive = false
    }
  }, [selectedFunctionId, setValue])

  useEffect(() => {
    if (!selectedDivisionId) {
      setDepartmentOptions([])
      setValue('departmentId', '')
      return
    }

    let isActive = true

    const loadDepartments = async () => {
      setLoadingCount((current) => current + 1)

      try {
        const children = await fetchOrganizationUnits(
          `/api/organization-units/${encodeURIComponent(selectedDivisionId)}/children`
        )

        if (isActive) {
          setDepartmentOptions(
            sortOrgUnitsByName(
              children.filter((item) => item.level === 'Department')
            )
          )
        }
      } catch {
        if (isActive) {
          setDepartmentOptions([])
          toast.error('โหลดรายการ Department ไม่สำเร็จ')
        }
      } finally {
        setLoadingCount((current) => Math.max(0, current - 1))
      }
    }

    loadDepartments()

    return () => {
      isActive = false
    }
  }, [selectedDivisionId, setValue])

  return {
    plantOptions,
    buOptions,
    functionOptions,
    divisionOptions,
    departmentOptions,
    isOrgLoading: loadingCount > 0,
    selectedPlantId,
    selectedBuId,
    selectedFunctionId,
    selectedDivisionId,
  }
}
