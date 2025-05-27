import { type MappingAlgorithm, theme } from 'antd-v5';
import {theme as supersetTheme} from "../preamble";

export const neonAlgorithm: MappingAlgorithm = seedToken => {
  const darkTokens = theme.darkAlgorithm(seedToken);
  return {
    ...darkTokens,
    borderRadiusLG: supersetTheme.borderRadius,
    borderRadiusOuter: supersetTheme.borderRadius,
    borderRadiusSM: supersetTheme.borderRadius,
    borderRadiusXS: supersetTheme.borderRadius,

    colorBgLayout: '#0f172a',
    colorBgMask: '#1e293b',
    colorBgSpotlight: '#334155',

    colorBorder: '#475569',
    colorBorderSecondary: '#334155',

    colorErrorActive: supersetTheme.colors.error.dark2,
    colorErrorBg: supersetTheme.colors.error.dark1,
    colorErrorBgActive: supersetTheme.colors.error.base,
    colorErrorBgHover: supersetTheme.colors.error.dark1,
    colorErrorBorder: supersetTheme.colors.error.base,
    colorErrorBorderHover: supersetTheme.colors.error.base,
    colorErrorHover: supersetTheme.colors.error.light1,
    colorErrorText: supersetTheme.colors.error.light2,
    colorErrorTextHover: supersetTheme.colors.error.light2,

    colorFill: '#1e293b',
    colorFillSecondary: '#334155',
    colorFillTertiary: '#475569',

    colorInfoActive: supersetTheme.colors.info.light2,
    colorInfoBg: supersetTheme.colors.info.dark2,
    colorInfoBgHover: supersetTheme.colors.info.dark1,
    colorInfoBorder: supersetTheme.colors.info.dark1,
    colorInfoBorderHover: supersetTheme.colors.info.base,
    colorInfoHover: supersetTheme.colors.info.light1,
    colorInfoText: supersetTheme.colors.info.light2,
    colorInfoTextActive: supersetTheme.colors.info.light3,
    colorInfoTextHover: supersetTheme.colors.info.light2,

    colorLinkActive: supersetTheme.colors.info.light2,
    colorLinkHover: supersetTheme.colors.info.light1,

    colorPrimaryActive: supersetTheme.colors.primary.light3,
    colorPrimaryBg: supersetTheme.colors.primary.dark2,
    colorPrimaryBgHover: supersetTheme.colors.primary.dark1,
    colorPrimaryBorder: supersetTheme.colors.primary.dark1,
    colorPrimaryBorderHover: supersetTheme.colors.primary.base,
    colorPrimaryHover: supersetTheme.colors.primary.light2,
    colorPrimaryText: supersetTheme.colors.primary.light2,
    colorPrimaryTextActive: supersetTheme.colors.primary.light3,
    colorPrimaryTextHover: supersetTheme.colors.primary.light2,

    colorSuccessActive: supersetTheme.colors.success.light2,
    colorSuccessBg: supersetTheme.colors.success.dark2,
    colorSuccessBgHover: supersetTheme.colors.success.dark1,
    colorSuccessBorder: supersetTheme.colors.success.dark1,
    colorSuccessBorderHover: supersetTheme.colors.success.base,
    colorSuccessHover: supersetTheme.colors.success.light1,
    colorSuccessText: supersetTheme.colors.success.light2,
    colorSuccessTextActive: supersetTheme.colors.success.light3,
    colorSuccessTextHover: supersetTheme.colors.success.light2,

    colorText: '#e2e8f0',
    colorTextQuaternary: '#94a3b8',
    colorTextSecondary: supersetTheme.colors.text.label,
    colorTextTertiary: supersetTheme.colors.text.help,

    colorWarningActive: supersetTheme.colors.warning.light2,
    colorWarningBg: supersetTheme.colors.warning.dark2,
    colorWarningBgHover: supersetTheme.colors.warning.dark1,
    colorWarningBorder: supersetTheme.colors.warning.dark1,
    colorWarningBorderHover: supersetTheme.colors.warning.base,
    colorWarningHover: supersetTheme.colors.warning.light1,
    colorWarningText: supersetTheme.colors.warning.light2,
    colorWarningTextActive: supersetTheme.colors.warning.light3,
    colorWarningTextHover: supersetTheme.colors.warning.light2,

    colorWhite: '#0f172a',

    fontSizeHeading1: supersetTheme.typography.sizes.xxl,
    fontSizeHeading2: supersetTheme.typography.sizes.xl,
    fontSizeHeading3: supersetTheme.typography.sizes.l,
    fontSizeHeading4: supersetTheme.typography.sizes.m,
    fontSizeHeading5: supersetTheme.typography.sizes.s,

    fontSizeLG: supersetTheme.typography.sizes.l,
    fontSizeSM: supersetTheme.typography.sizes.s,
    fontSizeXL: supersetTheme.typography.sizes.xl,

    lineWidthBold: supersetTheme.gridUnit / 2,
  };
};
