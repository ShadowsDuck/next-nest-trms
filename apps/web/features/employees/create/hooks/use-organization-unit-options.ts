'use client'

import { useEffect, useState } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  type OrganizationOption,
  getBusinessUnits,
  getDepartments,
  getDivisions,
  getFunctions,
  getPlants,
  sortOrgUnitsByName,
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
  setValue,
}: UseOrganizationUnitOptionsParams): OrganizationUnitOptionsResult {
  const [plantOptions, setPlantOptions] = useState<OrganizationOption[]>([])
  const [buOptions, setBuOptions] = useState<OrganizationOption[]>([])
  const [functionOptions, setFunctionOptions] = useState<OrganizationOption[]>(
    []
  )
  const [divisionOptions, setDivisionOptions] = useState<OrganizationOption[]>(
    []
  )
  const [departmentOptions, setDepartmentOptions] = useState<
    OrganizationOption[]
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
        const plants = await getPlants()

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

    void loadPlants()

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
        const businessUnits = await getBusinessUnits(selectedPlantId)

        if (isActive) {
          setBuOptions(sortOrgUnitsByName(businessUnits))
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

    void loadBusinessUnits()

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
        const functions = await getFunctions(selectedBuId)

        if (isActive) {
          setFunctionOptions(sortOrgUnitsByName(functions))
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

    void loadFunctions()

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
        const divisions = await getDivisions(selectedFunctionId)

        if (isActive) {
          setDivisionOptions(sortOrgUnitsByName(divisions))
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

    void loadDivisions()

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
        const departments = await getDepartments(selectedDivisionId)

        if (isActive) {
          setDepartmentOptions(sortOrgUnitsByName(departments))
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

    void loadDepartments()

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

