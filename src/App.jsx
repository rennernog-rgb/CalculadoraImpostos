import { useState, useMemo } from 'react'
import {
  Info, Trash2, Copy, TrendingUp, TrendingDown,
  Truck, AlertTriangle, ChevronDown
} from 'lucide-react'

// ─── DADOS ESTÁTICOS ────────────────────────────────────────────────────────

const minerios = [
  { id: 'ferro',         nome: 'Ferro',          cfem: 0.035 },
  { id: 'ouro',          nome: 'Ouro',            cfem: 0.03  },
  { id: 'bauxita',       nome: 'Bauxita',         cfem: 0.03  },
  { id: 'cobre',         nome: 'Cobre',           cfem: 0.03  },
  { id: 'manganes',      nome: 'Manganês',        cfem: 0.03  },
  { id: 'niobio',        nome: 'Nióbio',          cfem: 0.03  },
  { id: 'calcario',      nome: 'Calcário',        cfem: 0.02  },
  { id: 'areia_cascalho',nome: 'Areia/Cascalho',  cfem: 0.02  },
  { id: 'outros',        nome: 'Outros',          cfem: 0.02  },
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

// Alíquotas internas por estado (padrão 18% onde não especificado)
const aliquotasInternas = {
  AC: 0.17, AL: 0.18, AP: 0.18, AM: 0.18, BA: 0.19, CE: 0.18,
  DF: 0.18, ES: 0.17, GO: 0.17, MA: 0.18, MT: 0.17, MS: 0.17,
  MG: 0.18, PA: 0.17, PB: 0.18, PR: 0.19, PE: 0.18, PI: 0.18,
  RJ: 0.20, RN: 0.18, RS: 0.17, RO: 0.17, RR: 0.17, SC: 0.17,
  SP: 0.18, SE: 0.18, TO: 0.18,
}

// Regiões para cálculo interestadual
const sulSudeste = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'] // ES excluído intencionalmente
const norteNordesteCOES = ['AC','AL','AP','AM','BA','CE','DF','GO','MA','MT','MS',
                           'PA','PB','PE','PI','RN','RO','RR','SE','TO','ES','PI']

/**
 * Retorna a alíquota de ICMS para o par origem/destino.
 * Interna  → alíquota interna do estado de origem
 * Interestadual Sul/SE (exceto ES) → destino N/NE/CO/ES: 7%
 * Demais interestaduais → 12%
 */
function getAliquotaICMS(origem, destino) {
  if (origem === destino) return aliquotasInternas[origem] ?? 0.18
  if (sulSudeste.includes(origem) && norteNordesteCOES.includes(destino)) return 0.07
  return 0.12
}

// ─── FUNÇÕES DE CÁLCULO ──────────────────────────────────────────────────────

function calcularAtual(inputs) {
  const {
    tipoMinerio, valorCompra, valorVenda, valorFrete,
    modalidadeFrete, estadoOrigem, estadoDestino,
  } = inputs

  const compra  = parseFloat(valorCompra) || 0
  const venda   = parseFloat(valorVenda)  || 0
  const frete   = parseFloat(valorFrete)  || 0
  const isCIF   = modalidadeFrete === 'CIF'

  const minerio = minerios.find(m => m.id === tipoMinerio) ?? minerios[0]

  // Base de cálculo do ICMS
  const baseICMS = isCIF ? venda + frete : venda

  // ICMS
  const aliqICMS = getAliquotaICMS(estadoOrigem, estadoDestino)
  const icms     = baseICMS * aliqICMS

  // PIS + COFINS (regime cumulativo — Lucro Presumido)
  const pisCofins = venda * 0.0365   // 0,65% + 3%

  // IRPJ + CSLL (Lucro Presumido)
  const irpjCsll  = venda * 0.0228   // 1,2% + 1,08%

  // TRIFON / Taxa de Fiscalização Mineral
  const trifon    = venda * 0.01

  // CFEM — apenas informativo (custo da mineradora, embutido no preço de compra)
  const cfemInformativo = compra * minerio.cfem

  const totalImpostos = icms + pisCofins + irpjCsll + trifon

  const custoTotal   = isCIF ? compra + frete : compra
  const lucroBruto   = venda - custoTotal
  const lucroLiquido = lucroBruto - totalImpostos
  const margemLiquida = venda > 0 ? (lucroLiquido / venda) * 100 : 0

  return {
    baseICMS,
    aliqICMS,
    icms,
    pisCofins,
    irpjCsll,
    trifon,
    cfemInformativo,
    cfemAliq: minerio.cfem,
    totalImpostos,
    custoTotal,
    lucroBruto,
    lucroLiquido,
    margemLiquida,
    isCIF,
    frete,
  }
}

function calcular2027(inputs) {
  const {
    tipoMinerio, valorCompra, valorVenda, valorFrete,
    modalidadeFrete, estadoOrigem, estadoDestino,
  } = inputs

  const compra  = parseFloat(valorCompra) || 0
  const venda   = parseFloat(valorVenda)  || 0
  const frete   = parseFloat(valorFrete)  || 0
  const isCIF   = modalidadeFrete === 'CIF'

  const minerio = minerios.find(m => m.id === tipoMinerio) ?? minerios[0]

  // PIS/COFINS extintos
  const pisCofins = 0

  // CBS — substitui PIS/COFINS
  const cbs = venda * 0.088

  // IBS — fase inicial de transição (ainda baixo)
  const ibs = venda * 0.001

  // ICMS ainda vigente em 2027 (extinção gradual a partir de 2029)
  const baseICMS = isCIF ? venda + frete : venda
  const aliqICMS = getAliquotaICMS(estadoOrigem, estadoDestino)
  const icms     = baseICMS * aliqICMS

  // IRPJ + CSLL sem alteração
  const irpjCsll = venda * 0.0228

  // TRIFON sem alteração
  const trifon = venda * 0.01

  // CFEM informativo
  const cfemInformativo = compra * minerio.cfem

  const totalImpostos = cbs + ibs + icms + irpjCsll + trifon

  const custoTotal    = isCIF ? compra + frete : compra
  const lucroBruto    = venda - custoTotal
  const lucroLiquido  = lucroBruto - totalImpostos
  const margemLiquida = venda > 0 ? (lucroLiquido / venda) * 100 : 0

  return {
    baseICMS,
    aliqICMS,
    icms,
    pisCofins,
    cbs,
    ibs,
    irpjCsll,
    trifon,
    cfemInformativo,
    cfemAliq: minerio.cfem,
    totalImpostos,
    custoTotal,
    lucroBruto,
    lucroLiquido,
    margemLiquida,
    isCIF,
    frete,
  }
}

// ─── ESTADO INICIAL DO FORMULÁRIO ───────────────────────────────────────────

const estadoInicial = {
  tipoMinerio:      'ferro',
  valorCompra:      '',
  valorVenda:       '',
  valorFrete:       '',
  modalidadeFrete:  'CIF',
  estadoOrigem:     'SP',
  estadoDestino:    'RJ',
  regime:           'atual',
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [form, setForm] = useState(estadoInicial)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleLimpar() {
    setForm(estadoInicial)
  }

  // Resultados recalculados automaticamente a cada mudança no formulário
  const resultadoAtual = useMemo(() => calcularAtual(form), [form])
  const resultado2027  = useMemo(() => calcular2027(form),  [form])

  // Resultado do regime selecionado no toggle
  const resultado = form.regime === 'atual' ? resultadoAtual : resultado2027

  return (
    <div>App em construção</div>
  )
}
