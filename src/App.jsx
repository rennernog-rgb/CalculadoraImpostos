import { useState, useMemo } from 'react'
import {
  Info, Trash2, Copy, TrendingUp, TrendingDown,
  Truck, AlertTriangle, DollarSign, BarChart2,
  ShoppingCart, Package, CheckCheck
} from 'lucide-react'

// ─── DADOS ESTÁTICOS ────────────────────────────────────────────────────────

const minerios = [
  { id: 'ferro',          nome: 'Ferro',          cfem: 0.035 },
  { id: 'ouro',           nome: 'Ouro',            cfem: 0.03  },
  { id: 'bauxita',        nome: 'Bauxita',         cfem: 0.03  },
  { id: 'cobre',          nome: 'Cobre',           cfem: 0.03  },
  { id: 'manganes',       nome: 'Manganês',        cfem: 0.03  },
  { id: 'niobio',         nome: 'Nióbio',          cfem: 0.03  },
  { id: 'calcario',       nome: 'Calcário',        cfem: 0.02  },
  { id: 'areia_cascalho', nome: 'Areia/Cascalho',  cfem: 0.02  },
  { id: 'outros',         nome: 'Outros',          cfem: 0.02  },
]

const estados = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
]

const aliquotasInternas = {
  AC: 0.17, AL: 0.18, AP: 0.18, AM: 0.18, BA: 0.19, CE: 0.18,
  DF: 0.18, ES: 0.17, GO: 0.17, MA: 0.18, MT: 0.17, MS: 0.17,
  MG: 0.18, PA: 0.17, PB: 0.18, PR: 0.19, PE: 0.18, PI: 0.18,
  RJ: 0.20, RN: 0.18, RS: 0.17, RO: 0.17, RR: 0.17, SC: 0.17,
  SP: 0.18, SE: 0.18, TO: 0.18,
}

const sulSudeste       = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS']
const norteNordesteCOES = ['AC','AL','AP','AM','BA','CE','DF','GO','MA','MT','MS',
                            'PA','PB','PE','PI','RN','RO','RR','SE','TO','ES']

function getAliquotaICMS(origem, destino) {
  if (origem === destino) return aliquotasInternas[origem] ?? 0.18
  if (sulSudeste.includes(origem) && norteNordesteCOES.includes(destino)) return 0.07
  return 0.12
}

// ─── FUNÇÕES DE CÁLCULO ──────────────────────────────────────────────────────

function calcularAtual(inputs) {
  const { tipoMinerio, valorCompra, valorVenda, valorFrete, modalidadeFrete, estadoOrigem, estadoDestino } = inputs
  const compra  = parseFloat(valorCompra) || 0
  const venda   = parseFloat(valorVenda)  || 0
  const frete   = parseFloat(valorFrete)  || 0
  const isCIF   = modalidadeFrete === 'CIF'
  const minerio = minerios.find(m => m.id === tipoMinerio) ?? minerios[0]

  const baseICMS      = isCIF ? venda + frete : venda
  const aliqICMS      = getAliquotaICMS(estadoOrigem, estadoDestino)
  const icms          = baseICMS * aliqICMS
  const pisCofins     = venda * 0.0365
  const irpjCsll      = venda * 0.0228
  const trifon        = venda * 0.01
  const cfemInformativo = compra * minerio.cfem
  const totalImpostos = icms + pisCofins + irpjCsll + trifon
  const custoTotal    = isCIF ? compra + frete : compra
  const lucroBruto    = venda - custoTotal
  const lucroLiquido  = lucroBruto - totalImpostos
  const margemLiquida = venda > 0 ? (lucroLiquido / venda) * 100 : 0

  return { baseICMS, aliqICMS, icms, pisCofins, irpjCsll, trifon,
           cfemInformativo, cfemAliq: minerio.cfem, totalImpostos,
           custoTotal, lucroBruto, lucroLiquido, margemLiquida, isCIF, frete }
}

function calcular2027(inputs) {
  const { tipoMinerio, valorCompra, valorVenda, valorFrete, modalidadeFrete, estadoOrigem, estadoDestino } = inputs
  const compra  = parseFloat(valorCompra) || 0
  const venda   = parseFloat(valorVenda)  || 0
  const frete   = parseFloat(valorFrete)  || 0
  const isCIF   = modalidadeFrete === 'CIF'
  const minerio = minerios.find(m => m.id === tipoMinerio) ?? minerios[0]

  const pisCofins     = 0
  const cbs           = venda * 0.088
  const ibs           = venda * 0.001
  const baseICMS      = isCIF ? venda + frete : venda
  const aliqICMS      = getAliquotaICMS(estadoOrigem, estadoDestino)
  const icms          = baseICMS * aliqICMS
  const irpjCsll      = venda * 0.0228
  const trifon        = venda * 0.01
  const cfemInformativo = compra * minerio.cfem
  const totalImpostos = cbs + ibs + icms + irpjCsll + trifon
  const custoTotal    = isCIF ? compra + frete : compra
  const lucroBruto    = venda - custoTotal
  const lucroLiquido  = lucroBruto - totalImpostos
  const margemLiquida = venda > 0 ? (lucroLiquido / venda) * 100 : 0

  return { baseICMS, aliqICMS, icms, pisCofins, cbs, ibs, irpjCsll, trifon,
           cfemInformativo, cfemAliq: minerio.cfem, totalImpostos,
           custoTotal, lucroBruto, lucroLiquido, margemLiquida, isCIF, frete }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmt = (v) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const pct = (v) => `${(v ?? 0).toFixed(2).replace('.', ',')}%`

// ─── COMPONENTES REUTILIZÁVEIS ───────────────────────────────────────────────

function Tooltip({ texto }) {
  return (
    <span className="group relative inline-flex items-center ml-1 cursor-help">
      <Info size={13} className="text-zinc-500 group-hover:text-amber-400 transition-colors" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56
                       bg-zinc-800 border border-zinc-600 text-zinc-300 text-xs rounded px-2 py-1.5
                       opacity-0 group-hover:opacity-100 transition-opacity z-50 leading-snug shadow-xl">
        {texto}
      </span>
    </span>
  )
}

function CardImposto({ nome, aliq, valor, tooltip, destaque = false }) {
  return (
    <div className={`rounded-lg px-4 py-3 flex items-center justify-between border transition-all
      ${destaque
        ? 'bg-amber-900/20 border-amber-700/40'
        : 'bg-zinc-800/60 border-zinc-700/40 hover:border-zinc-600/60'}`}>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-medium ${destaque ? 'text-amber-300' : 'text-zinc-200'}`}>
          {nome}
        </span>
        {tooltip && <Tooltip texto={tooltip} />}
        {aliq && (
          <span className="ml-1 text-xs text-zinc-500 font-mono">{aliq}</span>
        )}
      </div>
      <span className={`font-display text-lg tracking-wide ${destaque ? 'text-amber-400' : 'text-zinc-100'}`}>
        {fmt(valor)}
      </span>
    </div>
  )
}

function CardCfem({ valor, aliq }) {
  return (
    <div className="rounded-lg px-4 py-3 border border-zinc-700/30 bg-zinc-900/50 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-zinc-500">CFEM (informativo)</span>
        <Tooltip texto="Compensação Financeira pela Exploração Mineral. Pago pela mineradora extratora. Como revendedora, este custo já está embutido no seu preço de compra. Exibido apenas para referência." />
        <span className="ml-1 text-xs text-zinc-600 font-mono">{pct(aliq * 100)}</span>
      </div>
      <div className="text-right">
        <span className="text-zinc-500 font-display text-base tracking-wide">{fmt(valor)}</span>
        <span className="block text-xs text-zinc-600">não somado</span>
      </div>
    </div>
  )
}

function LabelField({ children, label, tooltip }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center">
        {label}
        {tooltip && <Tooltip texto={tooltip} />}
      </span>
      {children}
    </label>
  )
}

const inputCls = `w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2.5
  text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30
  placeholder-zinc-600 transition-colors`

const selectCls = `${inputCls} cursor-pointer`

// ─── COMPONENTE COMPARATIVO ──────────────────────────────────────────────────

function ComparativoRegimes({ atual, r2027, venda }) {
  const diffImpostos   = r2027.totalImpostos - atual.totalImpostos
  const diffLucro      = r2027.lucroLiquido  - atual.lucroLiquido
  const pctDiffImp     = atual.totalImpostos !== 0
    ? (diffImpostos / Math.abs(atual.totalImpostos)) * 100 : 0
  const pctDiffLucro   = atual.lucroLiquido !== 0
    ? (diffLucro / Math.abs(atual.lucroLiquido)) * 100 : 0

  const Seta = ({ diff, pct: p, inverso = false }) => {
    const sobe = diff > 0
    const cor  = inverso
      ? (sobe ? 'text-red-400' : 'text-emerald-400')
      : (sobe ? 'text-emerald-400' : 'text-red-400')
    return (
      <span className={`flex items-center gap-0.5 text-xs font-semibold ${cor}`}>
        {sobe ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {sobe ? '+' : ''}{p.toFixed(1).replace('.', ',')}%
      </span>
    )
  }

  const linhas = [
    {
      label: 'Total de Impostos',
      v2026: atual.totalImpostos,
      v2027: r2027.totalImpostos,
      diff: diffImpostos,
      pctDiff: pctDiffImp,
      inverso: true,
    },
    {
      label: 'Lucro Líquido',
      v2026: atual.lucroLiquido,
      v2027: r2027.lucroLiquido,
      diff: diffLucro,
      pctDiff: pctDiffLucro,
      inverso: false,
    },
    {
      label: 'Margem Líquida',
      v2026: null,
      v2027: null,
      margem2026: atual.margemLiquida,
      margem2027: r2027.margemLiquida,
      isMargem: true,
    },
  ]

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h2 className="font-display text-xl tracking-widest text-zinc-300 mb-4">
        COMPARATIVO 2026 vs 2027
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-xs text-zinc-500 pb-2 font-medium">Indicador</th>
              <th className="text-right text-xs text-zinc-500 pb-2 font-medium">2026 (Atual)</th>
              <th className="text-right text-xs text-zinc-500 pb-2 font-medium">2027 (Reforma)</th>
              <th className="text-right text-xs text-zinc-500 pb-2 font-medium">Variação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.label} className="border-b border-zinc-800/60 last:border-0">
                <td className="py-3 text-zinc-400">{l.label}</td>
                {l.isMargem ? (
                  <>
                    <td className="py-3 text-right font-mono text-zinc-200">
                      {l.margem2026.toFixed(2).replace('.', ',')}%
                    </td>
                    <td className="py-3 text-right font-mono text-zinc-200">
                      {l.margem2027.toFixed(2).replace('.', ',')}%
                    </td>
                    <td className="py-3 text-right">
                      <Seta diff={l.margem2027 - l.margem2026} pct={Math.abs(l.margem2027 - l.margem2026)} inverso={false} />
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`py-3 text-right font-mono ${l.v2026 < 0 ? 'text-red-400' : 'text-zinc-200'}`}>
                      {fmt(l.v2026)}
                    </td>
                    <td className={`py-3 text-right font-mono ${l.v2027 < 0 ? 'text-red-400' : 'text-zinc-200'}`}>
                      {fmt(l.v2027)}
                    </td>
                    <td className="py-3 text-right">
                      {venda > 0
                        ? <Seta diff={l.diff} pct={Math.abs(l.pctDiff)} inverso={l.inverso} />
                        : <span className="text-zinc-600 text-xs">—</span>}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── ESTADO INICIAL ───────────────────────────────────────────────────────────

const estadoInicial = {
  tipoMinerio:     'ferro',
  valorCompra:     '',
  valorVenda:      '',
  valorFrete:      '',
  modalidadeFrete: 'CIF',
  estadoOrigem:    'SP',
  estadoDestino:   'RJ',
  regime:          'atual',
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [form, setForm]     = useState(estadoInicial)
  const [copied, setCopied] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleLimpar() {
    setForm(estadoInicial)
  }

  const resultadoAtual = useMemo(() => calcularAtual(form), [form])
  const resultado2027  = useMemo(() => calcular2027(form),  [form])
  const resultado      = form.regime === 'atual' ? resultadoAtual : resultado2027
  const is2027         = form.regime === '2027'
  const venda          = parseFloat(form.valorVenda) || 0

  function handleExportar() {
    const r   = resultado
    const reg = is2027 ? 'Reforma Tributária 2027' : 'Regime Atual 2026'
    const minerio = minerios.find(m => m.id === form.tipoMinerio)
    const data = new Date().toLocaleDateString('pt-BR')

    const linhas = [
      `╔═══════════════════════════════════════╗`,
      `  CALCULADORA DE IMPOSTOS — REVENDEDORA DE MINÉRIOS`,
      `  Regime: ${reg}   |   Data: ${data}`,
      `╚═══════════════════════════════════════╝`,
      ``,
      `OPERAÇÃO`,
      `  Minério: ${minerio?.nome ?? form.tipoMinerio}`,
      `  Origem: ${form.estadoOrigem} → Destino: ${form.estadoDestino}`,
      `  Frete: ${form.modalidadeFrete}`,
      ``,
      `VALORES`,
      `  Valor de Compra : ${fmt(parseFloat(form.valorCompra) || 0)}`,
      `  Valor de Venda  : ${fmt(venda)}`,
      `  Valor do Frete  : ${fmt(parseFloat(form.valorFrete) || 0)} (${form.modalidadeFrete})`,
      `  Custo Total     : ${fmt(r.custoTotal)}`,
      ``,
      `IMPOSTOS`,
      `  ICMS (${pct(r.aliqICMS * 100)})     : ${fmt(r.icms)}`,
      ...(is2027
        ? [
            `  CBS (8,80%)          : ${fmt(resultado2027.cbs)}`,
            `  IBS (0,10%)          : ${fmt(resultado2027.ibs)}`,
            `  PIS/COFINS           : R$ 0,00 (extintos)`,
          ]
        : [`  PIS+COFINS (3,65%)  : ${fmt(r.pisCofins)}`]),
      `  IRPJ+CSLL (2,28%)    : ${fmt(r.irpjCsll)}`,
      `  TRIFON (1,00%)       : ${fmt(r.trifon)}`,
      `  CFEM (informativo)   : ${fmt(r.cfemInformativo)}`,
      `  ─────────────────────────────────────`,
      `  TOTAL DE IMPOSTOS    : ${fmt(r.totalImpostos)}`,
      ``,
      `RESULTADO`,
      `  Lucro Bruto    : ${fmt(r.lucroBruto)}`,
      `  Lucro Líquido  : ${fmt(r.lucroLiquido)}`,
      `  Margem Líquida : ${pct(r.margemLiquida)}`,
      ``,
      `COMPARATIVO 2026 vs 2027`,
      `  Impostos 2026  : ${fmt(resultadoAtual.totalImpostos)}`,
      `  Impostos 2027  : ${fmt(resultado2027.totalImpostos)}`,
      `  Lucro 2026     : ${fmt(resultadoAtual.lucroLiquido)}`,
      `  Lucro 2027     : ${fmt(resultado2027.lucroLiquido)}`,
      ``,
      `Estimativas fiscais para Lucro Presumido. Consulte um contador.`,
    ]

    navigator.clipboard.writeText(linhas.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-body">

      {/* ── HEADER ── */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl tracking-widest text-amber-400 leading-none">
              CALCULADORA DE IMPOSTOS
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Revendedora de Minérios · Lucro Presumido</p>
          </div>

          {/* Toggle regime */}
          <div className="flex items-center bg-zinc-800 rounded-lg p-1 border border-zinc-700 shrink-0">
            <button
              onClick={() => setForm(prev => ({ ...prev, regime: 'atual' }))}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                !is2027
                  ? 'bg-amber-500 text-zinc-900 shadow-lg shadow-amber-900/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}>
              Regime Atual (2026)
            </button>
            <button
              onClick={() => setForm(prev => ({ ...prev, regime: '2027' }))}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                is2027
                  ? 'bg-amber-500 text-zinc-900 shadow-lg shadow-amber-900/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}>
              Reforma 2027
            </button>
          </div>
        </div>
      </header>

      {/* ── BANNER 2027 ── */}
      {is2027 && (
        <div className="bg-amber-900/30 border-b border-amber-700/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">
              Projeção estimada com base na Reforma Tributária (LC 214/2025).
              Alíquotas definitivas ainda em regulamentação.
            </p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ════════════════════════════════════════
            COLUNA ESQUERDA — FORMULÁRIO
            ════════════════════════════════════════ */}
        <section className="space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="font-display text-xl tracking-widest text-zinc-300">DADOS DA OPERAÇÃO</h2>

            {/* Tipo de minério */}
            <LabelField label="Tipo de Minério"
              tooltip="Selecione o minério negociado. A alíquota CFEM varia por tipo e é exibida de forma informativa.">
              <select name="tipoMinerio" value={form.tipoMinerio} onChange={handleChange} className={selectCls}>
                {minerios.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nome} — CFEM {(m.cfem * 100).toFixed(1)}%
                  </option>
                ))}
              </select>
            </LabelField>

            {/* Valores */}
            <div className="grid grid-cols-2 gap-3">
              <LabelField label="Valor de Compra (R$)"
                tooltip="Preço pago ao produtor/mineradora pelo minério.">
                <input type="number" name="valorCompra" value={form.valorCompra}
                  onChange={handleChange} placeholder="0,00" min="0" step="0.01" className={inputCls} />
              </LabelField>
              <LabelField label="Valor de Venda (R$)"
                tooltip="Preço cobrado pelo minério na revenda. Base de cálculo principal dos impostos.">
                <input type="number" name="valorVenda" value={form.valorVenda}
                  onChange={handleChange} placeholder="0,00" min="0" step="0.01" className={inputCls} />
              </LabelField>
            </div>

            {/* Frete */}
            <div className="grid grid-cols-2 gap-3">
              <LabelField label="Valor do Frete (R$)"
                tooltip="Valor do frete da operação. No CIF, entra na base do ICMS. No FOB, é custo do comprador.">
                <input type="number" name="valorFrete" value={form.valorFrete}
                  onChange={handleChange} placeholder="0,00" min="0" step="0.01" className={inputCls} />
              </LabelField>
              <LabelField label="Modalidade do Frete"
                tooltip="CIF (Cost, Insurance & Freight): o vendedor arca com o frete — valor entra na base do ICMS. FOB (Free on Board): o comprador contrata o frete — não entra na base do ICMS desta NF.">
                <select name="modalidadeFrete" value={form.modalidadeFrete} onChange={handleChange} className={selectCls}>
                  <option value="CIF">CIF — frete por conta do vendedor</option>
                  <option value="FOB">FOB — frete por conta do comprador</option>
                </select>
              </LabelField>
            </div>

            {/* Tag frete */}
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${
              form.modalidadeFrete === 'CIF'
                ? 'bg-amber-900/20 border-amber-700/30 text-amber-300'
                : 'bg-blue-900/20 border-blue-700/30 text-blue-300'}`}>
              <Truck size={13} />
              {form.modalidadeFrete === 'CIF'
                ? 'Frete CIF: ICMS incide sobre o frete'
                : 'Frete FOB: ICMS não incide sobre o frete nesta NF'}
            </div>
          </div>

          {/* Estados */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="font-display text-xl tracking-widest text-zinc-300">ORIGEM & DESTINO</h2>
            <div className="grid grid-cols-2 gap-3">
              <LabelField label="Estado de Origem"
                tooltip="Estado onde o minério é vendido (saída da NF).">
                <select name="estadoOrigem" value={form.estadoOrigem} onChange={handleChange} className={selectCls}>
                  {estados.map(e => (
                    <option key={e.sigla} value={e.sigla}>{e.sigla} — {e.nome}</option>
                  ))}
                </select>
              </LabelField>
              <LabelField label="Estado de Destino"
                tooltip="Estado do comprador. Determina se a operação é interna ou interestadual e qual alíquota de ICMS se aplica.">
                <select name="estadoDestino" value={form.estadoDestino} onChange={handleChange} className={selectCls}>
                  {estados.map(e => (
                    <option key={e.sigla} value={e.sigla}>{e.sigla} — {e.nome}</option>
                  ))}
                </select>
              </LabelField>
            </div>

            {/* Tag ICMS */}
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-3 py-2 text-xs">
              <span className="text-zinc-400">
                {form.estadoOrigem === form.estadoDestino ? 'Operação interna' : 'Operação interestadual'}
              </span>
              <span className="text-amber-400 font-mono font-semibold">
                ICMS {pct(resultado.aliqICMS * 100)}
              </span>
            </div>
          </div>

          {/* Botão limpar */}
          <button onClick={handleLimpar}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-700
                       text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors text-sm">
            <Trash2 size={15} />
            Limpar campos
          </button>
        </section>

        {/* ════════════════════════════════════════
            COLUNA DIREITA — RESULTADOS
            ════════════════════════════════════════ */}
        <section className="space-y-4 animate-fadeSlide" key={form.regime}>

          {/* Detalhamento dos impostos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <h2 className="font-display text-xl tracking-widest text-zinc-300">IMPOSTOS INCIDENTES</h2>

            <CardImposto
              nome="ICMS"
              aliq={pct(resultado.aliqICMS * 100)}
              valor={resultado.icms}
              tooltip={`Imposto sobre Circulação de Mercadorias. Alíquota ${pct(resultado.aliqICMS * 100)} para ${form.estadoOrigem}→${form.estadoDestino}. Base: ${fmt(resultado.baseICMS)} (${resultado.isCIF ? 'CIF: inclui frete' : 'FOB: apenas venda'}).`}
            />

            {is2027 ? (
              <>
                <CardImposto
                  nome="CBS"
                  aliq="8,80%"
                  valor={resultado2027.cbs}
                  tooltip="Contribuição sobre Bens e Serviços. Substitui o PIS e a COFINS a partir de 2027 (Reforma Tributária). Alíquota estimada em 8,8%."
                  destaque
                />
                <CardImposto
                  nome="IBS"
                  aliq="0,10%"
                  valor={resultado2027.ibs}
                  tooltip="Imposto sobre Bens e Serviços. Substitui gradualmente o ICMS e ISS. Em 2027 está na fase inicial de transição com alíquota baixa (~0,1%). Extinção total do ICMS prevista para 2033."
                  destaque
                />
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-zinc-800/40 border border-zinc-700/30 text-xs text-zinc-500">
                  <Info size={12} />
                  PIS/COFINS extintos em 2027 — substituídos pela CBS
                </div>
              </>
            ) : (
              <CardImposto
                nome="PIS + COFINS"
                aliq="3,65%"
                valor={resultado.pisCofins}
                tooltip="PIS (0,65%) + COFINS (3%) no regime cumulativo. Aplicável a empresas no Lucro Presumido. Base de cálculo: valor de venda."
              />
            )}

            <CardImposto
              nome="IRPJ + CSLL"
              aliq="2,28%"
              valor={resultado.irpjCsll}
              tooltip="Imposto de Renda Pessoa Jurídica (base presumida 8% × alíquota 15% = 1,2%) + Contribuição Social sobre Lucro Líquido (base presumida 12% × alíquota 9% = 1,08%). Total: 2,28% sobre a receita bruta."
            />

            <CardImposto
              nome="TRIFON"
              aliq="1,00%"
              valor={resultado.trifon}
              tooltip="Taxa de Fiscalização de Recursos Minerais. Estimativa de 1% sobre o valor de venda para operações de revenda de minérios."
            />

            <div className="border-t border-zinc-800 pt-3 mt-2">
              <CardCfem valor={resultado.cfemInformativo} aliq={resultado.cfemAliq} />
            </div>

            {/* Total de impostos */}
            <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-zinc-200">Total de Impostos</span>
                {venda > 0 && (
                  <span className="block text-xs text-zinc-500">
                    {pct((resultado.totalImpostos / venda) * 100)} sobre a venda
                  </span>
                )}
              </div>
              <span className="font-display text-2xl tracking-wide text-amber-400">
                {fmt(resultado.totalImpostos)}
              </span>
            </div>
          </div>

          {/* Resumo financeiro */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <h2 className="font-display text-xl tracking-widest text-zinc-300">RESUMO FINANCEIRO</h2>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="flex items-center gap-2 text-zinc-400">
                  <ShoppingCart size={14} /> Valor de Compra
                </span>
                <span className="text-zinc-200 font-mono">{fmt(parseFloat(form.valorCompra) || 0)}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Truck size={14} />
                  Frete
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    form.modalidadeFrete === 'CIF'
                      ? 'bg-amber-900/40 text-amber-400'
                      : 'bg-blue-900/40 text-blue-400'}`}>
                    {form.modalidadeFrete}
                  </span>
                </span>
                <span className="text-zinc-400 font-mono">
                  {resultado.isCIF ? fmt(resultado.frete) : `${fmt(resultado.frete)} (custo do comprador)`}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="flex items-center gap-2 text-zinc-400">
                  <DollarSign size={14} /> Valor de Venda
                </span>
                <span className="text-zinc-200 font-mono">{fmt(venda)}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Package size={14} /> Custo Total
                </span>
                <span className="text-zinc-200 font-mono">{fmt(resultado.custoTotal)}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="flex items-center gap-2 text-zinc-400">
                  <BarChart2 size={14} /> Total de Impostos
                </span>
                <span className="text-red-400 font-mono">− {fmt(resultado.totalImpostos)}</span>
              </div>
            </div>

            {/* Lucro líquido em destaque */}
            <div className={`rounded-lg px-4 py-4 border flex items-center justify-between ${
              resultado.lucroLiquido >= 0
                ? 'bg-emerald-900/20 border-emerald-700/40'
                : 'bg-red-900/20 border-red-700/40'}`}>
              <div>
                <span className="text-sm font-semibold text-zinc-300">Lucro Líquido</span>
                <span className="block text-xs text-zinc-500">após impostos e custos</span>
              </div>
              <div className="text-right">
                <span className={`font-display text-3xl tracking-wide ${
                  resultado.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmt(resultado.lucroLiquido)}
                </span>
                <span className={`block text-sm font-medium ${
                  resultado.lucroLiquido >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {resultado.lucroLiquido >= 0 ? <TrendingUp size={14} className="inline mr-1" /> : <TrendingDown size={14} className="inline mr-1" />}
                  Margem: {pct(resultado.margemLiquida)}
                </span>
              </div>
            </div>

            {/* Alerta de prejuízo */}
            {resultado.lucroLiquido < 0 && venda > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-3 animate-fadeSlide">
                <AlertTriangle size={16} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-300 font-medium">
                  ⚠️ Operação com prejuízo! Revise os custos ou o preço de venda.
                </p>
              </div>
            )}
          </div>

        </section>
      </main>

      {/* ════════════════════════════════════════
          SEÇÃO FULL-WIDTH — COMPARATIVO + EXPORTAR
          ════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 space-y-4">

        <ComparativoRegimes
          atual={resultadoAtual}
          r2027={resultado2027}
          venda={venda}
        />

        {/* Botão exportar */}
        <button
          onClick={handleExportar}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-medium
                      text-sm transition-all duration-200 ${
            copied
              ? 'bg-emerald-900/30 border-emerald-600/50 text-emerald-400'
              : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-amber-600/60 hover:text-amber-300 hover:bg-amber-900/10'
          }`}>
          {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
          {copied ? 'Resumo copiado para a área de transferência!' : 'Exportar Resumo (copiar)'}
        </button>

        {/* Rodapé */}
        <p className="text-xs text-zinc-600 leading-relaxed text-center px-2 pb-2">
          Cálculos baseados em estimativas fiscais para revendedoras no Lucro Presumido.
          Alíquotas da Reforma Tributária (2027) são projeções sujeitas a regulamentação.
          Consulte um contador.
        </p>
      </div>
    </div>
  )
}
