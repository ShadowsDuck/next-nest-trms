import { colorSchemeDark, themeQuartz } from 'ag-grid-community'

const customThemeParams = {
  backgroundColor: 'var(--background)',
  foregroundColor: 'var(--foreground)',
  borderColor: 'var(--border)',

  headerBackgroundColor: 'var(--background)',
  headerTextColor: 'var(--muted-foreground)',
  headerRowBorderBottom: '1px solid var(--border)',

  rowHoverColor: 'var(--muted)',
  rowBorderColor: 'var(--border)',

  menuBackgroundColor: 'var(--popover)',
  menuTextColor: 'var(--popover-foreground)',
  menuBorder: '1px solid var(--border)',
  menuShadow: 'var(--shadow-md)',

  activeColor: 'var(--primary)',
  checkboxCheckedBackgroundColor: 'var(--primary)',
  checkboxCheckedShapeColor: 'var(--primary-foreground)',

  fontFamily: 'var(--font-sans)',
  wrapperBorderRadius: 'var(--radius)',
  wrapperBorder: '1px solid var(--border)',
}

export const lightTheme = themeQuartz.withParams(customThemeParams)
export const darkTheme = themeQuartz
  .withPart(colorSchemeDark)
  .withParams(customThemeParams)
