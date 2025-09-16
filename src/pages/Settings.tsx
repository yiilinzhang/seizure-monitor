import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ListRow } from '../components/ListRow';
import { Toggle } from '../components/Toggle';
import { NumberField } from '../components/NumberField';
import { RefreshCwIcon, DatabaseIcon, DownloadIcon, InfoIcon } from 'lucide-react';
export const Settings: React.FC = () => {
  const [samplingRate, setSamplingRate] = useState(2);
  const [cloudStorage, setCloudStorage] = useState(false);
  return <Layout title="Settings">
      <div className="space-y-6 mt-4">
        <Card>
          <h2 className="text-h2 font-semibold mb-4">Sensor</h2>
          <Button variant="secondary" fullWidth className="mb-4">
            <RefreshCwIcon size={16} className="mr-2" />
            Re-baseline
          </Button>
          <div>
            <div className="text-bodySmall text-ink-60 mb-1">
              Sampling rate (Hz)
            </div>
            <NumberField value={samplingRate} onChange={setSamplingRate} min={1} max={5} step={1} unit="Hz" />
          </div>
        </Card>
        <Card>
          <h2 className="text-h2 font-semibold mb-4">Data</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-bodySmall font-semibold">
                  Cloud Storage
                </div>
                <div className="text-bodySmall text-ink-60">
                  Sync data across devices
                </div>
              </div>
              <Toggle checked={cloudStorage} onChange={setCloudStorage} />
            </div>
            <Button variant="secondary" fullWidth className="flex items-center justify-center">
              <DownloadIcon size={16} className="mr-2" />
              <span>Export data (CSV)</span>
            </Button>
          </div>
        </Card>
        <Card>
          <h2 className="text-h2 font-semibold mb-4">About</h2>
          <div className="space-y-2">
            <ListRow icon={<InfoIcon size={20} className="text-ink-60" />} title="Version" meta="1.0.2 (build 145)" />
            <ListRow icon={<DatabaseIcon size={20} className="text-ink-60" />} title="Firmware" meta="v2.3.1" />
          </div>
          <div className="mt-4 text-bodySmall text-ink-60">
            © 2023 MethoneSense Inc. All rights reserved.
          </div>
        </Card>
      </div>
    </Layout>;
};