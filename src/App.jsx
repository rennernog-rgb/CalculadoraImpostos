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

  return (
    <div>App em construção</div>
  )
}
