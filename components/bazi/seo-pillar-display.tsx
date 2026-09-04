import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SeoPillarInfo, SeoBaziResult } from '@/lib/seo-bazi';
import type { WuXing } from '@/engine/types';

const WUXING_COLOR: Record<WuXing, string> = {
  wood: 'text-wuxing-wood',
  fire: 'text-wuxing-fire',
  earth: 'text-wuxing-earth',
  metal: 'text-wuxing-metal',
  water: 'text-wuxing-water',
};

interface Props {
  pillar: SeoPillarInfo;
  label: string;
}

export function PillarDisplay({ pillar, label }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2 pb-4">
        <div className="flex gap-1">
          <Link
            href={`/tiangan/${pillar.stem}`}
            className={`text-4xl font-bold hover:underline ${WUXING_COLOR[pillar.stemElement]}`}
            title={`${pillar.stem} · ${pillar.stemCn}`}
          >
            {pillar.stem}
          </Link>
          <Link
            href={`/dizhi/${pillar.branch}`}
            className={`text-4xl font-bold hover:underline ${WUXING_COLOR[pillar.branchElement]}`}
            title={`${pillar.branch} · ${pillar.branchCn}`}
          >
            {pillar.branch}
          </Link>
        </div>
        <div className="flex gap-1 text-xs text-muted-foreground">
          <span>{pillar.stemCn}</span>
          <span>·</span>
          <span>{pillar.branchCn}</span>
        </div>
        <Link href={`/ganzhi/${pillar.ganzhi}`} className="text-sm text-primary hover:underline">
          {pillar.ganzhi}
        </Link>
        <Badge variant="outline" className="text-[10px]">
          {pillar.nanyin}
        </Badge>
        {pillar.changSheng && (
          <span className="text-[10px] text-muted-foreground">
            十二长生：{pillar.changSheng}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

interface SummaryProps {
  result: SeoBaziResult;
}

export function BaziSummaryCard({ result }: SummaryProps) {
  const { lunar } = result;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">基本信息</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">公历</p>
          <p className="font-medium">
            {result.year}年{result.month ? `${result.month}月` : ''}
            {result.day ? `${result.day}日` : ''}
            {result.hour !== undefined ? `${result.hour}时` : ''}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">农历</p>
          <p className="font-medium">
            {lunar.yearGanZhi}年（{lunar.animal}）
            {result.month ? `${lunar.monthName}月` : ''}
            {result.day ? `${lunar.dayName}` : ''}
            {lunar.isLeapMonth ? ' (闰)' : ''}
          </p>
        </div>
        {result.jieqi && (
          <div>
            <p className="text-xs text-muted-foreground">节气</p>
            <p className="font-medium">{result.jieqi}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
