'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiAnalysis } from '@/components/bazi/ai-analysis';
import type { BaziJson, Pillar, WuXing, Interaction } from '@/engine/types';
import { WUXING_CN, STRENGTH_CN, STEM_WUXING, BRANCH_ELEM_MAP } from '@/engine/types';

interface BaziResultProps {
  data: BaziJson;
  chartId: string;
  cached: boolean;
}

const PILLAR_LABELS: { key: 'year' | 'month' | 'day' | 'hour'; label: string }[] = [
  { key: 'year', label: '年柱' },
  { key: 'month', label: '月柱' },
  { key: 'day', label: '日柱' },
  { key: 'hour', label: '时柱' },
];

const WUXING_COLOR: Record<WuXing, string> = {
  wood: 'text-wuxing-wood',
  fire: 'text-wuxing-fire',
  earth: 'text-wuxing-earth',
  metal: 'text-wuxing-metal',
  water: 'text-wuxing-water',
};

const WUXING_BG_BAR: Record<WuXing, string> = {
  wood: 'bg-wuxing-wood',
  fire: 'bg-wuxing-fire',
  earth: 'bg-wuxing-earth',
  metal: 'bg-wuxing-metal',
  water: 'bg-wuxing-water',
};

const INTERACTION_LABEL: Record<Interaction['type'], string> = {
  COMBINATION_2: '六合',
  COMBINATION_3: '三合',
  COMBINATION_3_DIRECTION: '三会',
  HALF_COMBINATION: '半合',
  CLASH: '相冲',
  PUNISHMENT: '相刑',
  HARM: '相害',
  BREAK: '相破',
};

function PillarCard({ pillar, label, isDayMaster }: { pillar: Pillar | null; label: string; isDayMaster?: boolean }) {
  if (!pillar) {
    return (
      <Card className="flex flex-col items-center justify-center border-dashed">
        <CardContent className="p-4 text-center text-muted-foreground">
          <p className="text-sm">{label}</p>
          <p className="mt-2 text-xs">无</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className={isDayMaster ? 'border-primary/60 ring-1 ring-primary/30' : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-1 pb-4">
        <div className="flex gap-1">
          <span
            className={`text-3xl font-bold ${WUXING_COLOR[pillar.stemElement]}`}
            title={`${WUXING_CN[pillar.stemElement]} · ${pillar.stem}`}
          >
            {pillar.stem}
          </span>
          <span
            className={`text-3xl font-bold ${WUXING_COLOR[pillar.branchElement]}`}
            title={`${WUXING_CN[pillar.branchElement]} · ${pillar.branch}`}
          >
            {pillar.branch}
          </span>
        </div>
        <div className="flex gap-1 text-xs text-muted-foreground">
          <span>{WUXING_CN[pillar.stemElement]}</span>
          <span>{WUXING_CN[pillar.branchElement]}</span>
        </div>
        <Badge variant="outline" className="mt-1 text-[10px]">
          {pillar.shishen}
        </Badge>
        <p className="text-[10px] text-muted-foreground">
          {pillar.changSheng} · {pillar.nanyin}
        </p>
        {isDayMaster && (
          <Badge variant="secondary" className="text-[10px]">日主</Badge>
        )}
      </CardContent>
    </Card>
  );
}

function WuxingPanel({ wuxing }: { wuxing: BaziJson['wuxing'] }) {
  const order: WuXing[] = ['wood', 'fire', 'earth', 'metal', 'water'];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">五行分布</CardTitle>
        <CardDescription>金木水火土占比与缺失</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {order.map((el) => {
          const pct = Math.round(wuxing.percentage[el]);
          const count = wuxing.count[el];
          return (
            <div key={el} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className={WUXING_COLOR[el]}>
                  {WUXING_CN[el]} · {count}个
                </span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-muted">
                <div
                  className={`h-full ${WUXING_BG_BAR[el]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {wuxing.missing.length > 0 && (
          <p className="pt-2 text-sm text-destructive">
            缺：{wuxing.missing.map((m) => WUXING_CN[m]).join('、')}
          </p>
        )}
        {wuxing.dominant.length > 0 && (
          <p className="text-sm text-muted-foreground">
            最旺：{wuxing.dominant.map((d) => WUXING_CN[d]).join('、')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TenGodsTable({ tenGods }: { tenGods: BaziJson['tenGods'] }) {
  const rows = [
    { key: 'year', label: '年柱' },
    { key: 'month', label: '月柱' },
    { key: 'day', label: '日柱' },
    { key: 'hour', label: '时柱' },
  ] as const;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">十神 / 藏干</CardTitle>
        <CardDescription>天干十神、地支本气与藏干十神</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-2">柱</th>
                <th className="py-2 pr-2">干</th>
                <th className="py-2 pr-2">干十神</th>
                <th className="py-2 pr-2">支</th>
                <th className="py-2 pr-2">本气十神</th>
                <th className="py-2">藏干</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ key, label }) => {
                const row = tenGods[key];
                if (!row) return null;
                return (
                  <tr key={key} className="border-b last:border-0">
                    <td className="py-2 pr-2 text-muted-foreground">{label}</td>
                    <td className="py-2 pr-2 font-medium">{row.stem}</td>
                    <td className="py-2 pr-2">
                      <Badge variant="outline" className="text-[10px]">
                        {row.stemTenGod}
                      </Badge>
                    </td>
                    <td className="py-2 pr-2 font-medium">{row.branch}</td>
                    <td className="py-2 pr-2">
                      <Badge variant="outline" className="text-[10px]">
                        {row.branchTenGod}
                      </Badge>
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {row.branchHidden.map((h, i) => (
                        <span key={i} className="mr-1">
                          {h.stem}({h.tenGod})
                        </span>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function InteractionsPanel({ interactions }: { interactions: BaziJson['interactions'] }) {
  const groups: { key: keyof BaziJson['interactions']; label: string }[] = [
    { key: 'combinations', label: '合' },
    { key: 'clashes', label: '冲' },
    { key: 'punishments', label: '刑' },
    { key: 'harms', label: '害' },
    { key: 'breaks', label: '破' },
    { key: 'meetings', label: '会' },
  ];
  const hasAny = groups.some((g) => interactions[g.key].length > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">刑冲合害</CardTitle>
        <CardDescription>四柱地支间的相互作用</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasAny && (
          <p className="text-sm text-muted-foreground">四柱无明显刑冲合害。</p>
        )}
        {groups.map(({ key, label }) => {
          const list = interactions[key];
          if (list.length === 0) return null;
          return (
            <div key={key} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <div className="flex flex-wrap gap-2">
                {list.map((it: Interaction, i) => (
                  <Badge key={i} variant="secondary" className="text-[11px]">
                    {INTERACTION_LABEL[it.type]}：{it.description}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function DaYunTimeline({ daYun, liuNian }: { daYun: BaziJson['daYun']; liuNian: BaziJson['liuNian'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          大运 / 流年
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {daYun.direction === 'FORWARD' ? '顺排' : '逆排'} · 起运 {daYun.startAge} 岁
          </span>
        </CardTitle>
        <CardDescription>每步大运 10 年，附当前大运下流年</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
          {daYun.entries.map((e) => (
            <div
              key={e.index}
              className="rounded-md border border-border bg-muted/40 p-2 text-center"
            >
              <p className="text-[10px] text-muted-foreground">
                {e.startAge}-{e.endAge}岁
              </p>
              <p className="text-[10px] text-muted-foreground">
                {e.startYear}-{e.endYear}
              </p>
              <p className="mt-1 text-lg font-bold">
                <span className={WUXING_COLOR[STEM_WUXING[e.stem]]}>{e.stem}</span>
                <span className={WUXING_COLOR[BRANCH_ELEM_MAP[e.branch]]}>{e.branch}</span>
              </p>
              <p className="text-[10px] text-muted-foreground">第{e.index}运</p>
            </div>
          ))}
        </div>
        {liuNian.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              流年（当前大运范围内）
            </p>
            <div className="flex flex-wrap gap-2">
              {liuNian.map((l) => (
                <div
                  key={l.year}
                  className="rounded border border-border bg-card px-2 py-1 text-center"
                >
                  <p className="text-[10px] text-muted-foreground">
                    {l.year}年 · {l.age}岁
                  </p>
                  <p className="text-sm font-medium">
                    <span className={WUXING_COLOR[STEM_WUXING[l.stem]]}>{l.stem}</span>
                    <span className={WUXING_COLOR[BRANCH_ELEM_MAP[l.branch]]}>{l.branch}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function MetaPanel({ data }: { data: BaziJson }) {
  const lunar = data.input.lunar;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">命盘概要</CardTitle>
        <CardDescription>历法与日主信息</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
        <Info label="性别" value={data.input.gender === 'MALE' ? '男' : '女'} />
        <Info
          label="公历"
          value={`${data.input.solar.year}-${pad(data.input.solar.month)}-${pad(data.input.solar.day)} ${pad(data.input.solar.hour)}:${pad(data.input.solar.minute)}`}
        />
        <Info
          label="农历"
          value={`${lunar.year}年${lunar.monthName}${lunar.dayName}${lunar.isLeapMonth ? '(闰)' : ''}`}
        />
        <Info
          label="真太阳时"
          value={`${pad(data.input.solarTime.correctedHour)}:${pad(data.input.solarTime.correctedMinute)}${data.input.solarTime.dayRolled ? ' (次日)' : ''}`}
        />
        <Info label="时区" value={data.input.location.timezone} />
        <Info label="出生地" value={data.input.location.placeName ?? '—'} />
        <Info label="当前节气" value={data.jieqi.current.name} />
        <Info
          label="日主"
          value={`${data.dayMaster.stem}（${WUXING_CN[data.dayMaster.element]} · ${data.dayMaster.yinYang === 'YANG' ? '阳' : '阴'} · ${STRENGTH_CN[data.dayMaster.strength]}）`}
        />
        <Info
          label="格局"
          value={data.pattern.name ?? '未定'}
        />
        <Info
          label="喜用神"
          value={[...data.xiYong.xiShen, ...data.xiYong.yongShen]
            .map((w) => WUXING_CN[w])
            .join('、') || '—'}
        />
        <Info
          label="忌神"
          value={data.xiYong.jiShen.map((w) => WUXING_CN[w]).join('、') || '—'}
        />
        <Info label="纳音" value={[data.nanyin.year, data.nanyin.month, data.nanyin.day, data.nanyin.hour].filter(Boolean).join(' / ')} />
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function BaziResult({ data, chartId, cached }: BaziResultProps) {
  return (
    <div className="space-y-6">
      {/* 四柱 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">四柱八字</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {PILLAR_LABELS.map(({ key, label }) => (
            <PillarCard
              key={key}
              pillar={data.pillars[key]}
              label={label}
              isDayMaster={key === 'day'}
            />
          ))}
        </div>
      </section>

      {/* 概要 + 五行 */}
      <section className="grid gap-6 md:grid-cols-2">
        <MetaPanel data={data} />
        <WuxingPanel wuxing={data.wuxing} />
      </section>

      {/* 十神 */}
      <section>
        <TenGodsTable tenGods={data.tenGods} />
      </section>

      {/* 刑冲合害 */}
      <section>
        <InteractionsPanel interactions={data.interactions} />
      </section>

      {/* 大运流年 */}
      <section>
        <DaYunTimeline daYun={data.daYun} liuNian={data.liuNian} />
      </section>

      {/* 神煞 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">神煞</CardTitle>
          <CardDescription>年月日时柱所带神煞</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(['year', 'month', 'day', 'hour'] as const).map((pos) => (
            <div key={pos}>
              <p className="mb-1 text-xs text-muted-foreground">
                {PILLAR_LABELS.find((p) => p.key === pos)?.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {(data.shenSha[pos] ?? []).length === 0 ? (
                  <span className="text-xs text-muted-foreground">无</span>
                ) : (
                  (data.shenSha[pos] ?? []).map((s, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {s}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SEO 内链: 干支百科 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">相关百科</CardTitle>
          <CardDescription>深入了解四柱干支与五行</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.pillars.year?.ganzhi && (
            <Link href={`/ganzhi/${data.pillars.year.ganzhi}`} className="text-sm text-primary hover:underline">
              {data.pillars.year.ganzhi}
            </Link>
          )}
          {data.pillars.month?.ganzhi && (
            <Link href={`/ganzhi/${data.pillars.month.ganzhi}`} className="text-sm text-primary hover:underline">
              {data.pillars.month.ganzhi}
            </Link>
          )}
          {data.pillars.day?.ganzhi && (
            <Link href={`/ganzhi/${data.pillars.day.ganzhi}`} className="text-sm text-primary hover:underline">
              {data.pillars.day.ganzhi}
            </Link>
          )}
          {data.pillars.hour?.ganzhi && (
            <Link href={`/ganzhi/${data.pillars.hour.ganzhi}`} className="text-sm text-primary hover:underline">
              {data.pillars.hour.ganzhi}
            </Link>
          )}
          <Link href={`/wuxing/${data.dayMaster.element}`} className="text-sm text-primary hover:underline">
            日主五行：{WUXING_CN[data.dayMaster.element]}
          </Link>
          <Link href={`/bazi/${data.input.solar.year}`} className="text-sm text-primary hover:underline">
            {data.input.solar.year} 年
          </Link>
        </CardContent>
      </Card>

      {/* AI 命理解读 */}
      <AiAnalysis chartId={chartId} />

      {/* meta */}
      <p className="text-xs text-muted-foreground">
        命盘 ID：{chartId}
        {cached && '（命中缓存）'} · 引擎：{data.meta.engine}@{data.meta.engineVersion} · 计算时间：{data.meta.calculatedAt}
      </p>
    </div>
  );
}
