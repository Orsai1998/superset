import { t, ChartMetadata, ChartPlugin } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
import '@fontsource/russo-one';

export default class SupersetPluginChartErgPlanFact extends ChartPlugin {
  constructor() {
    const metadata = new ChartMetadata({
      name: t('ERG — План/Отклонение/Факт'),
      description: t(
        'Три столбца: План, Отклонение и Факт с крупными подписями, адаптировано для тёмных дашбордов.',
      ),
      thumbnail,
      useLegacyApi: false,
      credits: ['Apache ECharts'],
    });

    super({
      buildQuery,
      controlPanel,
      transformProps,
      loadChart: () =>
        import('../SupersetPluginChartErgPlanFact').then(m => m.default),
      metadata,
    });
  }
}
