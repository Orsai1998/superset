import { t, ChartMetadata, ChartPlugin } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';

export default class SupersetPluginMetallCut extends ChartPlugin {
  constructor() {
    const metadata = new ChartMetadata({
      description: 'Superset Plugin Metall Cut',
      name: t('Superset Plugin Metall Cut'),
      thumbnail,
    });

    super({
      buildQuery,
      controlPanel,
      loadChart: () => import('../SupersetPluginMetallCut'),
      metadata,
      transformProps,
    });
  }
}
