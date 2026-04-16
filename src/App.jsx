import { useState, useMemo, useRef } from 'react'
import {
  Info, Trash2, Copy, TrendingUp, TrendingDown,
  Truck, AlertTriangle, DollarSign, BarChart2,
  ShoppingCart, Package, CheckCheck, Lock, Eye, EyeOff, Calculator
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

// Alíquotas internas atualizadas 2026
const aliquotasInternas = {
  AC: 0.19, AL: 0.19, AP: 0.18, AM: 0.20, BA: 0.205, CE: 0.20,
  DF: 0.20, ES: 0.17, GO: 0.19, MA: 0.22, MT: 0.17,  MS: 0.17,
  MG: 0.18, PA: 0.19, PB: 0.20, PR: 0.195,PE: 0.205, PI: 0.21,
  RJ: 0.22, RN: 0.18, RS: 0.17, RO: 0.175,RR: 0.17,  SC: 0.17,
  SP: 0.18, SE: 0.19, TO: 0.20,
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
  const { valorCompra, valorVenda, valorFrete, modalidadeFrete,
          estadoOrigem, estadoDestino, estadoFornecedor } = inputs
  const compra  = parseVal(valorCompra)
  const venda   = parseVal(valorVenda)
  const frete   = parseVal(valorFrete)
  const isCIF   = modalidadeFrete === 'CIF'

  // ICMS da venda (débito)
  const baseICMS    = isCIF ? venda + frete : venda
  const aliqICMS    = getAliquotaICMS(estadoOrigem, estadoDestino)
  const icmsDebito  = baseICMS * aliqICMS

  // ICMS da compra (crédito — aproveitamento)
  const aliqICMSCompra = getAliquotaICMS(estadoFornecedor, estadoOrigem)
  const icmsCredito    = compra * aliqICMSCompra

  // ICMS líquido a recolher (nunca negativo — saldo credor fica para próximo período)
  const icmsLiquido = Math.max(0, icmsDebito - icmsCredito)

  const pisCofins     = venda * 0.0365
  const irpjCsll      = venda * 0.0228
  const totalImpostos = icmsLiquido + pisCofins + irpjCsll
  const custoTotal    = isCIF ? compra + frete : compra
  const lucroBruto    = venda - custoTotal
  const lucroLiquido  = lucroBruto - totalImpostos
  const margemLiquida = venda > 0 ? (lucroLiquido / venda) * 100 : 0

  return { baseICMS, aliqICMS, aliqICMSCompra, icmsDebito, icmsCredito, icmsLiquido,
           pisCofins, irpjCsll, totalImpostos,
           custoTotal, lucroBruto, lucroLiquido, margemLiquida, isCIF, frete }
}

function calcular2027(inputs) {
  const { valorCompra, valorVenda, valorFrete, modalidadeFrete,
          estadoOrigem, estadoDestino, estadoFornecedor } = inputs
  const compra  = parseVal(valorCompra)
  const venda   = parseVal(valorVenda)
  const frete   = parseVal(valorFrete)
  const isCIF   = modalidadeFrete === 'CIF'

  // CBS não-cumulativa — crédito da compra abatido da CBS da venda
  const cbsBruta   = venda * 0.088
  const cbsCredito = compra * 0.088
  const cbsLiquida = Math.max(0, cbsBruta - cbsCredito)
  const ibs        = venda * 0.001

  // ICMS ainda vigente em 2027 com aproveitamento
  const baseICMS       = isCIF ? venda + frete : venda
  const aliqICMS       = getAliquotaICMS(estadoOrigem, estadoDestino)
  const icmsDebito     = baseICMS * aliqICMS
  const aliqICMSCompra = getAliquotaICMS(estadoFornecedor, estadoOrigem)
  const icmsCredito    = compra * aliqICMSCompra
  const icmsLiquido    = Math.max(0, icmsDebito - icmsCredito)

  const irpjCsll      = venda * 0.0228
  const pisCofins     = 0
  const totalImpostos = cbsLiquida + ibs + icmsLiquido + irpjCsll
  const custoTotal    = isCIF ? compra + frete : compra
  const lucroBruto    = venda - custoTotal
  const lucroLiquido  = lucroBruto - totalImpostos
  const margemLiquida = venda > 0 ? (lucroLiquido / venda) * 100 : 0

  return { baseICMS, aliqICMS, aliqICMSCompra, icmsDebito, icmsCredito, icmsLiquido,
           cbsBruta, cbsCredito, cbsLiquida, ibs, pisCofins, irpjCsll, totalImpostos,
           custoTotal, lucroBruto, lucroLiquido, margemLiquida, isCIF, frete }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// Aceita tanto vírgula quanto ponto como separador decimal
const parseVal = (v) => parseFloat(String(v ?? '').replace(',', '.')) || 0

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
    <div className={`rounded-xl px-4 py-3 flex items-center justify-between transition-all card-lift overflow-hidden relative ${
      destaque ? '' : ''}`}
      style={destaque
        ? {background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)'}
        : {background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}}>
      {/* colored left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
        style={{background: destaque ? 'linear-gradient(180deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.1)'}} />
      <div className="flex items-center gap-1.5 pl-1">
        <span className={`text-sm font-medium ${destaque ? 'text-amber-300' : 'text-zinc-200'}`}>
          {nome}
        </span>
        {tooltip && <Tooltip texto={tooltip} />}
        {aliq && (
          <span className={`ml-1 text-xs font-mono ${destaque ? 'text-amber-500' : 'text-zinc-500'}`}>{aliq}</span>
        )}
      </div>
      <span className={`font-mono text-base font-semibold tracking-wide ${destaque ? 'text-amber-400' : 'text-zinc-100'}`}>
        {fmt(valor)}
      </span>
    </div>
  )
}


function LabelField({ children, label, tooltip }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-widest flex items-center gap-0.5"
        style={{color: 'rgba(161,161,170,0.85)'}}>
        {label}
        {tooltip && <Tooltip texto={tooltip} />}
      </span>
      {children}
    </label>
  )
}

const inputCls = `w-full text-zinc-100 rounded-xl px-3 py-2.5 text-sm placeholder-zinc-600
  transition-all input-glow`

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

  // bar widths for visual comparison (capped at 100%)
  const maxImp  = Math.max(atual.totalImpostos, r2027.totalImpostos, 0.01)
  const maxLucro = Math.max(Math.abs(atual.lucroLiquido), Math.abs(r2027.lucroLiquido), 0.01)

  return (
    <div className="glass rounded-2xl p-5 space-y-5" style={{border: '1px solid rgba(255,255,255,0.07)'}}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm tracking-widest font-semibold uppercase flex items-center gap-2"
          style={{color: 'rgba(245,158,11,0.9)'}}>
          <TrendingUp size={15} />
          Comparativo 2026 vs 2027
        </h2>
        <div className="flex items-center gap-3 text-xs" style={{color: 'rgba(113,113,122,0.8)'}}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{background: 'rgba(161,161,170,0.4)'}} />
            2026
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{background: 'rgba(245,158,11,0.7)'}} />
            2027
          </span>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="space-y-3">

        {/* Total de Impostos */}
        <div className="rounded-xl p-4 space-y-3" style={{background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{color: 'rgba(161,161,170,0.7)'}}>Total de Impostos</span>
            {venda > 0 && (
              <Seta diff={diffImpostos} pct={Math.abs(pctDiffImp)} inverso={true} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs mb-1.5" style={{color: 'rgba(113,113,122,0.8)'}}>2026 (Atual)</p>
              <p className={`font-mono font-semibold text-base ${atual.totalImpostos < 0 ? 'text-red-400' : 'text-zinc-200'}`}>
                {fmt(atual.totalImpostos)}
              </p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{background: 'rgba(255,255,255,0.06)'}}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{width: `${Math.min((atual.totalImpostos / maxImp) * 100, 100)}%`, background: 'rgba(161,161,170,0.5)'}} />
              </div>
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{color: 'rgba(113,113,122,0.8)'}}>2027 (Reforma)</p>
              <p className={`font-mono font-semibold text-base ${r2027.totalImpostos < 0 ? 'text-red-400' : 'text-amber-300'}`}>
                {fmt(r2027.totalImpostos)}
              </p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{background: 'rgba(255,255,255,0.06)'}}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{width: `${Math.min((r2027.totalImpostos / maxImp) * 100, 100)}%`, background: 'rgba(245,158,11,0.7)'}} />
              </div>
            </div>
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="rounded-xl p-4 space-y-3" style={{background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{color: 'rgba(161,161,170,0.7)'}}>Lucro Líquido</span>
            {venda > 0 && (
              <Seta diff={diffLucro} pct={Math.abs(pctDiffLucro)} inverso={false} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs mb-1.5" style={{color: 'rgba(113,113,122,0.8)'}}>2026 (Atual)</p>
              <p className={`font-mono font-semibold text-base ${atual.lucroLiquido < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {fmt(atual.lucroLiquido)}
              </p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{background: 'rgba(255,255,255,0.06)'}}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{width: `${Math.min((Math.abs(atual.lucroLiquido) / maxLucro) * 100, 100)}%`,
                    background: atual.lucroLiquido < 0 ? 'rgba(248,113,113,0.6)' : 'rgba(52,211,153,0.6)'}} />
              </div>
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{color: 'rgba(113,113,122,0.8)'}}>2027 (Reforma)</p>
              <p className={`font-mono font-semibold text-base ${r2027.lucroLiquido < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {fmt(r2027.lucroLiquido)}
              </p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{background: 'rgba(255,255,255,0.06)'}}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{width: `${Math.min((Math.abs(r2027.lucroLiquido) / maxLucro) * 100, 100)}%`,
                    background: r2027.lucroLiquido < 0 ? 'rgba(248,113,113,0.6)' : 'rgba(245,158,11,0.7)'}} />
              </div>
            </div>
          </div>
        </div>

        {/* Margem Líquida */}
        <div className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)'}}>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{color: 'rgba(161,161,170,0.7)'}}>Margem Líquida</span>
          <div className="flex items-center gap-4 text-sm font-mono font-semibold">
            <span className="text-zinc-300">{atual.margemLiquida.toFixed(2).replace('.', ',')}%</span>
            <span style={{color: 'rgba(113,113,122,0.5)'}}>→</span>
            <span className="text-amber-300">{r2027.margemLiquida.toFixed(2).replace('.', ',')}%</span>
            {venda > 0 && (
              <Seta diff={r2027.margemLiquida - atual.margemLiquida}
                pct={Math.abs(r2027.margemLiquida - atual.margemLiquida)} inverso={false} />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── ESTADO INICIAL ───────────────────────────────────────────────────────────

const estadoInicial = {
  tipoMinerio:      'ferro',
  valorCompra:      '',
  valorVenda:       '',
  valorFrete:       '',
  modalidadeFrete:  'CIF',
  estadoFornecedor: 'MG',
  estadoOrigem:     'SP',
  estadoDestino:    'RJ',
  regime:           'atual',
}

// ─── APP ──────────────────────────────────────────────────────────────────────

// ─── SENHA ───────────────────────────────────────────────────────────────────
const SENHA_CORRETA = '1810'

// ─── TELA DE LOGIN ────────────────────────────────────────────────────────────

function TelaLogin({ onAutenticar }) {
  const [senha, setSenha]       = useState('')
  const [erro, setErro]         = useState(false)
  const [visivel, setVisivel]   = useState(false)
  const [tentativas, setTentativas] = useState(0)
  const inputRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (senha === SENHA_CORRETA) {
      onAutenticar()
    } else {
      setErro(true)
      setTentativas(t => t + 1)
      setSenha('')
      setTimeout(() => setErro(false), 2000)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{background: 'linear-gradient(160deg, #08080f 0%, #0d0d1a 50%, #0a0a12 100%)'}}>

      {/* Fundo decorativo — brilhos radiais */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)'}} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full"
          style={{background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)'}} />
      </div>

      <div className="relative w-full max-w-xs anim-up">

        {/* Ícone + título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.06))',
              border: '1px solid rgba(245,158,11,0.3)',
              boxShadow: '0 0 32px rgba(245,158,11,0.15)'}}>
            <Lock size={26} className="text-amber-400" />
          </div>
          <h1 className="gradient-text font-display text-2xl tracking-widest uppercase leading-none">
            Calculadora
          </h1>
          <p className="text-xs mt-2 tracking-wide" style={{color: 'rgba(113,113,122,0.8)'}}>
            Revendedora de Minérios · Acesso Restrito
          </p>
        </div>

        {/* Card de login */}
        <form
          onSubmit={handleSubmit}
          className={`glass rounded-2xl p-6 space-y-5 transition-all duration-200 ${erro ? 'shake' : ''}`}
          style={erro
            ? {border: '1px solid rgba(248,113,113,0.4)', boxShadow: '0 0 24px rgba(248,113,113,0.1)'}
            : {border: '1px solid rgba(255,255,255,0.08)'}}
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2.5"
              style={{color: 'rgba(161,161,170,0.85)'}}>
              Senha de Acesso
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={visivel ? 'text' : 'password'}
                inputMode="numeric"
                value={senha}
                onChange={e => { setSenha(e.target.value); setErro(false) }}
                placeholder="••••"
                autoFocus
                className="w-full text-zinc-100 text-center text-2xl tracking-[0.6em] font-mono
                  rounded-xl px-4 py-3 pr-11 transition-all input-glow placeholder-zinc-700"
                style={erro
                  ? {background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.5)',
                    boxShadow: '0 0 0 3px rgba(248,113,113,0.12)'}
                  : {}}
              />
              <button
                type="button"
                onClick={() => setVisivel(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{color: 'rgba(113,113,122,0.8)'}}
              >
                {visivel ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <p className="text-xs text-red-400 mt-2 text-center anim-up">
                Senha incorreta. Tente novamente.
                {tentativas >= 3 && ' Verifique com o administrador.'}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-zinc-900 font-semibold text-sm tracking-wide transition-all btn-press"
            style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 4px 20px rgba(245,158,11,0.35)'}}>
            Entrar
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{color: 'rgba(63,63,70,0.9)'}}>
          Uso interno · Lucro Presumido
        </p>
      </div>
    </div>
  )
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [autenticado, setAutenticado] = useState(false)
  const [form, setForm]     = useState(estadoInicial)
  const [copied, setCopied] = useState(false)

  // ⚠️ Todos os hooks ANTES de qualquer return condicional (regra do React)
  const resultadoAtual = useMemo(() => calcularAtual(form), [form])
  const resultado2027  = useMemo(() => calcular2027(form),  [form])
  const resultado      = form.regime === 'atual' ? resultadoAtual : resultado2027
  const is2027         = form.regime === '2027'
  const venda          = parseVal(form.valorVenda)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleLimpar() {
    setForm(estadoInicial)
  }

  // Guard de autenticação — após todos os hooks
  if (!autenticado) {
    return <TelaLogin onAutenticar={() => setAutenticado(true)} />
  }

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
      `  Valor de Compra : ${fmt(parseVal(form.valorCompra))}`,
      `  Valor de Venda  : ${fmt(venda)}`,
      `  Valor do Frete  : ${fmt(parseVal(form.valorFrete))} (${form.modalidadeFrete})`,
      `  Custo Total     : ${fmt(r.custoTotal)}`,
      ``,
      `IMPOSTOS`,
      `  ICMS Débito  (${pct(r.aliqICMS * 100)} venda)  : ${fmt(r.icmsDebito)}`,
      `  ICMS Crédito (${pct(r.aliqICMSCompra * 100)} compra) : − ${fmt(r.icmsCredito)}`,
      `  ICMS a Recolher              : ${fmt(r.icmsLiquido)}`,
      ...(is2027
        ? [
            `  CBS Bruta  (8,80%)   : ${fmt(resultado2027.cbsBruta)}`,
      `  CBS Crédito          : − ${fmt(resultado2027.cbsCredito)}`,
      `  CBS a Recolher       : ${fmt(resultado2027.cbsLiquida)}`,
            `  IBS (0,10%)          : ${fmt(resultado2027.ibs)}`,
            `  PIS/COFINS           : R$ 0,00 (extintos em 2027)`,
          ]
        : [`  PIS+COFINS (3,65%)  : ${fmt(r.pisCofins)}`]),
      `  IRPJ+CSLL (2,28%)   : ${fmt(r.irpjCsll)}`,
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
    <div className="min-h-screen text-zinc-100 font-body" style={{background: 'linear-gradient(160deg, #08080f 0%, #0d0d1a 50%, #0a0a12 100%)'}}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 glass" style={{borderBottom: '1px solid rgba(245,158,11,0.15)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))', border: '1px solid rgba(245,158,11,0.3)'}}>
              <Calculator size={20} className="text-amber-400" />
            </div>
            <div>
              <h1 className="gradient-text font-display text-xl sm:text-2xl tracking-widest leading-none uppercase">
                Calculadora de Impostos
              </h1>
              <p className="text-xs mt-0.5" style={{color: 'rgba(161,161,170,0.7)'}}>Revendedora de Minérios · Lucro Presumido</p>
            </div>
          </div>

          {/* Toggle regime */}
          <div className="flex items-center rounded-xl p-1 shrink-0"
            style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)'}}>
            <button
              onClick={() => setForm(prev => ({ ...prev, regime: 'atual' }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all btn-press ${
                !is2027
                  ? 'text-zinc-900 shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={!is2027 ? {background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 16px rgba(245,158,11,0.35)'} : {}}>
              Regime Atual (2026)
            </button>
            <button
              onClick={() => setForm(prev => ({ ...prev, regime: '2027' }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all btn-press ${
                is2027
                  ? 'text-zinc-900 shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={is2027 ? {background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 16px rgba(245,158,11,0.35)'} : {}}>
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
        <section className="space-y-5 anim-up">
          <div className="glass rounded-2xl p-5 space-y-4 card-lift" style={{border: '1px solid rgba(255,255,255,0.07)'}}>
            <h2 className="font-display text-sm tracking-widest font-semibold uppercase flex items-center gap-2"
              style={{color: 'rgba(245,158,11,0.9)'}}>
              <ShoppingCart size={15} />
              Dados da Operação
            </h2>

            {/* Tipo de minério */}
            <LabelField label="Tipo de Minério"
              tooltip="Selecione o minério comercializado na operação de revenda.">
              <select name="tipoMinerio" value={form.tipoMinerio} onChange={handleChange} className={selectCls}>
                {minerios.map(m => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </LabelField>

            {/* Valores */}
            <div className="grid grid-cols-2 gap-3">
              <LabelField label="Valor de Compra (R$)"
                tooltip="Preço pago ao produtor/mineradora pelo minério.">
                <input type="text" inputMode="decimal" name="valorCompra" value={form.valorCompra}
                  onChange={handleChange} placeholder="0,00" className={inputCls} />
              </LabelField>
              <LabelField label="Valor de Venda (R$)"
                tooltip="Preço cobrado pelo minério na revenda. Base de cálculo principal dos impostos.">
                <input type="text" inputMode="decimal" name="valorVenda" value={form.valorVenda}
                  onChange={handleChange} placeholder="0,00" className={inputCls} />
              </LabelField>
            </div>

            {/* Frete */}
            <div className="grid grid-cols-2 gap-3">
              <LabelField label="Valor do Frete (R$)"
                tooltip="Valor do frete da operação. No CIF, entra na base do ICMS. No FOB, é custo do comprador.">
                <input type="text" inputMode="decimal" name="valorFrete" value={form.valorFrete}
                  onChange={handleChange} placeholder="0,00" className={inputCls} />
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
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${
              form.modalidadeFrete === 'CIF'
                ? 'text-amber-300'
                : 'text-sky-300'}`}
              style={{
                background: form.modalidadeFrete === 'CIF' ? 'rgba(245,158,11,0.08)' : 'rgba(56,189,248,0.08)',
                border: form.modalidadeFrete === 'CIF' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(56,189,248,0.2)'
              }}>
              <Truck size={13} />
              {form.modalidadeFrete === 'CIF'
                ? 'Frete CIF: ICMS incide sobre o frete'
                : 'Frete FOB: ICMS não incide sobre o frete nesta NF'}
            </div>
          </div>

          {/* Estados */}
          <div className="glass rounded-2xl p-5 space-y-4 card-lift" style={{border: '1px solid rgba(255,255,255,0.07)'}}>
            <h2 className="font-display text-sm tracking-widest font-semibold uppercase flex items-center gap-2"
              style={{color: 'rgba(245,158,11,0.9)'}}>
              <Truck size={15} />
              Origem & Destino
            </h2>

            <LabelField label="Estado do Fornecedor (Compra)"
              tooltip="Estado de onde você comprou o minério. Determina a alíquota de ICMS que gerou crédito na entrada, que será abatida do ICMS da venda.">
              <select name="estadoFornecedor" value={form.estadoFornecedor} onChange={handleChange} className={selectCls}>
                {estados.map(e => (
                  <option key={e.sigla} value={e.sigla}>{e.sigla} — {e.nome}</option>
                ))}
              </select>
            </LabelField>

            <div className="grid grid-cols-2 gap-3">
              <LabelField label="Estado de Origem (Venda)"
                tooltip="Estado de onde o minério sai na revenda (emissão da NF de saída).">
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

            {/* Tags ICMS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs"
                style={{background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)'}}>
                <span style={{color: 'rgba(161,161,170,0.8)'}}>Crédito ICMS compra ({form.estadoFornecedor}→{form.estadoOrigem})</span>
                <span className="text-emerald-400 font-mono font-semibold">{pct(resultado.aliqICMSCompra * 100)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs"
                style={{background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)'}}>
                <span style={{color: 'rgba(161,161,170,0.8)'}}>
                  {form.estadoOrigem === form.estadoDestino ? 'Débito ICMS venda — operação interna' : 'Débito ICMS venda — operação interestadual'}
                </span>
                <span className="text-amber-400 font-mono font-semibold">{pct(resultado.aliqICMS * 100)}</span>
              </div>
            </div>
          </div>

          {/* Botão limpar */}
          <button onClick={handleLimpar}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all btn-press"
            style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(161,161,170,0.8)'}}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(161,161,170,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
            <Trash2 size={15} />
            Limpar campos
          </button>
        </section>

        {/* ════════════════════════════════════════
            COLUNA DIREITA — RESULTADOS
            ════════════════════════════════════════ */}
        <section className="space-y-4 anim-up-2" key={form.regime}>

          {/* Detalhamento dos impostos */}
          <div className="glass rounded-2xl p-5 space-y-3" style={{border: '1px solid rgba(255,255,255,0.07)'}}>
            <h2 className="font-display text-sm tracking-widest font-semibold uppercase flex items-center gap-2"
              style={{color: 'rgba(245,158,11,0.9)'}}>
              <BarChart2 size={15} />
              Impostos Incidentes
            </h2>

            {/* ICMS com aproveitamento de crédito */}
            <div className="rounded-xl overflow-hidden" style={{border: '1px solid rgba(255,255,255,0.07)'}}>
              <div className="px-4 py-3 flex items-center justify-between" style={{background: 'rgba(255,255,255,0.03)'}}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-zinc-200">ICMS Débito</span>
                  <Tooltip texto={`ICMS da venda. Alíquota ${pct(resultado.aliqICMS * 100)} para ${form.estadoOrigem}→${form.estadoDestino}. Base: ${fmt(resultado.baseICMS)} (${resultado.isCIF ? 'CIF: inclui frete' : 'FOB: apenas venda'}).`} />
                  <span className="ml-1 text-xs font-mono text-zinc-500">{pct(resultado.aliqICMS * 100)}</span>
                </div>
                <span className="font-mono text-base font-semibold text-zinc-100">{fmt(resultado.icmsDebito)}</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between" style={{background: 'rgba(52,211,153,0.06)', borderTop: '1px solid rgba(52,211,153,0.12)'}}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-emerald-400">ICMS Crédito</span>
                  <Tooltip texto={`Crédito de ICMS aproveitado na compra. Alíquota ${pct(resultado.aliqICMSCompra * 100)} sobre ${form.estadoFornecedor}→${form.estadoOrigem}. Abatido do ICMS da venda.`} />
                  <span className="ml-1 text-xs font-mono text-emerald-600">{pct(resultado.aliqICMSCompra * 100)}</span>
                </div>
                <span className="font-mono text-base font-semibold text-emerald-400">− {fmt(resultado.icmsCredito)}</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between" style={{background: 'rgba(245,158,11,0.06)', borderTop: '1px solid rgba(245,158,11,0.15)'}}>
                <span className="text-sm font-semibold text-zinc-200">ICMS a Recolher</span>
                <span className="font-mono text-base font-bold text-amber-400">{fmt(resultado.icmsLiquido)}</span>
              </div>
            </div>

            {is2027 ? (
              <>
                {/* CBS com crédito da compra */}
                <div className="rounded-xl overflow-hidden" style={{border: '1px solid rgba(245,158,11,0.18)'}}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{background: 'rgba(245,158,11,0.04)'}}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-amber-300">CBS Bruta</span>
                      <Tooltip texto="CBS (Contribuição sobre Bens e Serviços) devida sobre o valor de venda. Alíquota estimada: 8,8%. Substitui o PIS/COFINS a partir de 2027." />
                      <span className="ml-1 text-xs font-mono text-amber-600">8,80%</span>
                    </div>
                    <span className="font-mono text-base font-semibold text-amber-200">{fmt(resultado2027.cbsBruta)}</span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between" style={{background: 'rgba(52,211,153,0.06)', borderTop: '1px solid rgba(52,211,153,0.12)'}}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-emerald-400">CBS Crédito</span>
                      <Tooltip texto="Sua revendedora aproveita o crédito de CBS pago pelo fornecedor na etapa anterior da cadeia. Apenas a diferença é recolhida." />
                      <span className="ml-1 text-xs font-mono text-emerald-600">8,80%</span>
                    </div>
                    <span className="font-mono text-base font-semibold text-emerald-400">− {fmt(resultado2027.cbsCredito)}</span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between" style={{background: 'rgba(245,158,11,0.09)', borderTop: '1px solid rgba(245,158,11,0.2)'}}>
                    <span className="text-sm font-semibold text-amber-300">CBS a Recolher</span>
                    <span className="font-mono text-base font-bold text-amber-400">{fmt(resultado2027.cbsLiquida)}</span>
                  </div>
                </div>
                <CardImposto
                  nome="IBS"
                  aliq="0,10%"
                  valor={resultado2027.ibs}
                  tooltip="Imposto sobre Bens e Serviços. Substitui gradualmente o ICMS e ISS. Em 2027 está na fase inicial de transição (~0,1%). Extinção total do ICMS prevista para 2033."
                  destaque
                />
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
                  style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(113,113,122,0.9)'}}>
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
              tooltip="Imposto de Renda Pessoa Jurídica (base presumida 8% × alíquota 15% = 1,2%) + CSLL (base presumida 12% × alíquota 9% = 1,08%). Total: 2,28% sobre a receita bruta."
            />

            {/* Total de impostos */}
            <div className="rounded-xl px-4 py-4 flex items-center justify-between"
              style={{background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))', border: '1px solid rgba(245,158,11,0.25)'}}>
              <div>
                <span className="text-sm font-semibold text-zinc-200">Total de Impostos</span>
                {venda > 0 && (
                  <span className="block text-xs mt-0.5" style={{color: 'rgba(161,161,170,0.7)'}}>
                    {pct((resultado.totalImpostos / venda) * 100)} sobre a venda
                  </span>
                )}
              </div>
              <span className="font-mono text-2xl font-bold text-amber-400">
                {fmt(resultado.totalImpostos)}
              </span>
            </div>
          </div>

          {/* Resumo financeiro */}
          <div className="glass rounded-2xl p-5 space-y-3 anim-up-3" style={{border: '1px solid rgba(255,255,255,0.07)'}}>
            <h2 className="font-display text-sm tracking-widest font-semibold uppercase flex items-center gap-2"
              style={{color: 'rgba(245,158,11,0.9)'}}>
              <DollarSign size={15} />
              Resumo Financeiro
            </h2>

            <div className="space-y-0 text-sm rounded-xl overflow-hidden" style={{border: '1px solid rgba(255,255,255,0.06)'}}>
              {[
                { icon: <ShoppingCart size={13} />, label: 'Valor de Compra', value: fmt(parseVal(form.valorCompra)), color: 'text-zinc-200' },
                {
                  icon: <Truck size={13} />, color: resultado.isCIF ? 'text-zinc-200' : 'text-zinc-500',
                  label: <span className="flex items-center gap-1.5">Frete
                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${form.modalidadeFrete === 'CIF' ? 'text-amber-400' : 'text-sky-400'}`}
                      style={{background: form.modalidadeFrete === 'CIF' ? 'rgba(245,158,11,0.15)' : 'rgba(56,189,248,0.15)'}}>
                      {form.modalidadeFrete}
                    </span>
                  </span>,
                  value: resultado.isCIF ? fmt(resultado.frete) : `${fmt(resultado.frete)} (comprador)`
                },
                { icon: <DollarSign size={13} />, label: 'Valor de Venda', value: fmt(venda), color: 'text-zinc-200' },
                { icon: <Package size={13} />, label: 'Custo Total', value: fmt(resultado.custoTotal), color: 'text-zinc-200' },
                { icon: <BarChart2 size={13} />, label: 'Total de Impostos', value: `− ${fmt(resultado.totalImpostos)}`, color: 'text-red-400' },
              ].map((row, i, arr) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5"
                  style={{background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}}>
                  <span className="flex items-center gap-2" style={{color: 'rgba(113,113,122,0.9)'}}>
                    {row.icon} {row.label}
                  </span>
                  <span className={`font-mono font-medium ${row.color || 'text-zinc-400'}`}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Lucro líquido em destaque */}
            <div className="rounded-xl px-4 py-4 flex items-center justify-between"
              style={resultado.lucroLiquido >= 0
                ? {background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)'}
                : {background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)'}}>
              <div>
                <span className="text-sm font-semibold text-zinc-200">Lucro Líquido</span>
                <span className="block text-xs mt-0.5" style={{color: 'rgba(113,113,122,0.8)'}}>após impostos e custos</span>
              </div>
              <div className="text-right">
                <span className={`font-mono text-2xl font-bold ${resultado.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmt(resultado.lucroLiquido)}
                </span>
                <span className={`flex items-center justify-end gap-1 text-sm font-medium mt-0.5 ${resultado.lucroLiquido >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {resultado.lucroLiquido >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  Margem: {pct(resultado.margemLiquida)}
                </span>
              </div>
            </div>

            {/* Alerta de prejuízo */}
            {resultado.lucroLiquido < 0 && venda > 0 && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 anim-up"
                style={{background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)'}}>
                <AlertTriangle size={15} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-300 font-medium">
                  Operação com prejuízo! Revise os custos ou o preço de venda.
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
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all btn-press"
          style={copied
            ? {background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399'}
            : {background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'rgba(245,158,11,0.9)'}}>
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
