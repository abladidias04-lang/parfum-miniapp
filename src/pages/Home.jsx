import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search } from 'lucide-react'

const PRICE_RANGES = [
  { label: '7 000 – 9 800 ₸', min: 7000, max: 9800 },
  { label: '9 800 – 13 800 ₸', min: 9800, max: 13800 },
  { label: '15 400 – 24 500 ₸', min: 15400, max: 99999 },
]

export default function Home() {
  const [perfumes, setPerfumes]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [searchQuery, setSearchQuery]     = useState('')
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectedVolumes, setSelectedVolumes] = useState([])
  const [priceRange, setPriceRange]       = useState('all')
  const [genderFilter, setGenderFilter]   = useState('all')
  const [priceType, setPriceType]         = useState('wholesale')
  const [sortBy, setSortBy]               = useState('alphabetical')
  const [selectedPerfume, setSelectedPerfume] = useState(null)
  const [cart, setCart]                   = useState([])
  const [isCartOpen, setIsCartOpen]       = useState(false)
  const [isFilterOpen, setIsFilterOpen]   = useState(false)
  const [visibleCount, setVisibleCount]   = useState(20)

  useEffect(() => { fetchPerfumes() }, [])

  useEffect(() => { setVisibleCount(20) }, [searchQuery, selectedBrands, selectedVolumes, priceRange, genderFilter, sortBy, priceType])

  async function fetchPerfumes() {
    const { data } = await supabase.from('perfumes').select('*').order('name')
    if (data) setPerfumes(data)
    setLoading(false)
  }

  const getDisplayPrice = (base) => priceType === 'retail' ? base + 3000 : base

  // СЕБЕТ
  const addToCart = (perfume, qty = 1) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === perfume.id)
      if (ex) return prev.map(i => i.id === perfume.id ? { ...i, quantity: i.quantity + qty } : i)
      return [...prev, { ...perfume, quantity: qty }]
    })
  }
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))
  const updateQty = (id, delta) => setCart(prev =>
    prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
  )
  const cartTotal = cart.reduce((s, i) => s + getDisplayPrice(i.price) * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  // TELEGRAM-ға ЗАКАЗ ЖІБЕРУ
  const sendOrderToBot = () => {
    const tg = window.Telegram?.WebApp
    if (!tg) { alert('Telegram WebApp жоқ'); return }
    const orderType = priceType === 'retail' ? 'Розница' : 'Опт'
    const payload = {
      order_type: orderType,
      is_opt: priceType === 'wholesale',
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        brand: i.brand || '',
        volume_ml: i.volume,
        quantity: i.quantity,
        unit_price: getDisplayPrice(i.price),
        subtotal: getDisplayPrice(i.price) * i.quantity,
      })),
      total_price: cartTotal,
    }
    tg.sendData(JSON.stringify(payload))
  }

  // ФИЛЬТР
  const availableBrands = [...new Map(
    perfumes.filter(p => p.brand).map(p => [p.brand.toLowerCase(), p.brand.trim()])
  ).values()].sort()
  const availableVolumes = [...new Set(perfumes.map(p => p.volume))].sort((a, b) => a - b)

  const toggleBrand = (b) => setSelectedBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])
  const toggleVolume = (v) => setSelectedVolumes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  const clearFilters = () => { setSelectedBrands([]); setSelectedVolumes([]); setPriceRange('all'); setGenderFilter('all') }
  const hasFilters = selectedBrands.length > 0 || selectedVolumes.length > 0 || priceRange !== 'all' || genderFilter !== 'all'

  const filtered = perfumes.filter(p => {
    const q = searchQuery.toLowerCase()
    const text = `${p.brand || ''} ${p.name} ${p.description || ''} ${p.gender || ''}`.toLowerCase()
    if (q && !q.split(' ').every(t => text.includes(t))) return false
    if (selectedBrands.length && !selectedBrands.some(b => (p.brand || '').toLowerCase() === b.toLowerCase())) return false
    if (selectedVolumes.length && !selectedVolumes.includes(p.volume)) return false
    if (genderFilter !== 'all' && p.gender !== genderFilter) return false
    if (priceRange !== 'all') {
      const r = PRICE_RANGES.find(x => x.label === priceRange)
      const dp = getDisplayPrice(p.price)
      if (r && (dp < r.min || dp > r.max)) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return getDisplayPrice(a.price) - getDisplayPrice(b.price)
    if (sortBy === 'price-desc') return getDisplayPrice(b.price) - getDisplayPrice(a.price)
    return a.name.localeCompare(b.name)
  })

  const similarPerfumes = selectedPerfume
    ? perfumes.filter(p => p.id !== selectedPerfume.id && (p.brand === selectedPerfume.brand || p.gender === selectedPerfume.gender)).slice(0, 3)
    : []

  return (
    <div className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-14">
          <span className="text-lg font-black tracking-tighter text-gray-900">by GULNAZ INAYATULLA</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* ІЗДЕУ + БАҒА ТҮРІ */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Парфюм немесе бренд іздеу..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-all ${hasFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
          >
            {hasFilters ? `Фильтр (${selectedBrands.length + selectedVolumes.length + (priceRange !== 'all' ? 1 : 0) + (genderFilter !== 'all' ? 1 : 0)})` : 'Фильтр'}
          </button>
        </div>

        {/* БАҒА ТҮРІ TOGGLE */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-4 w-full">
          <button
            onClick={() => setPriceType('wholesale')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${priceType === 'wholesale' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
          >
            Оптом (20+ дана)
          </button>
          <button
            onClick={() => setPriceType('retail')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${priceType === 'retail' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
          >
            Бөлшек (1-19 дана)
          </button>
        </div>

        {/* СОРТИРОВКА */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {[
            { value: 'alphabetical', label: 'А-Я' },
            { value: 'price-asc',    label: 'Арзан → Қымбат' },
            { value: 'price-desc',   label: 'Қымбат → Арзан' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${sortBy === opt.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* НӘТИЖЕ САНЫ */}
        <p className="text-xs text-gray-400 mb-3">{sorted.length} парфюм табылды</p>

        {/* КАРТОЧКАЛАР */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/5] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">Ештеңе табылмады</p>
            <button onClick={clearFilters} className="mt-3 text-indigo-500 text-sm font-bold">Фильтрді тазалау</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {sorted.slice(0, visibleCount).map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPerfume(p)}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-3 flex flex-col flex-grow">
                    {p.brand && <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-0.5">{p.brand}</p>}
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-1">{p.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">{p.volume} мл</p>
                    <p className="mt-auto text-base font-black text-indigo-600">{getDisplayPrice(p.price).toLocaleString('kk-KZ')} ₸</p>
                  </div>
                </div>
              ))}
            </div>
            {visibleCount < sorted.length && (
              <button
                onClick={() => setVisibleCount(v => v + 20)}
                className="w-full mt-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 bg-white"
              >
                Тағы көрсету ({sorted.length - visibleCount})
              </button>
            )}
          </>
        )}
      </div>

      {/* ФИЛЬТР ПАНЕЛІ */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-black">Фильтр</h3>
              <div className="flex gap-3">
                {hasFilters && <button onClick={clearFilters} className="text-sm text-red-500 font-bold">Тазалау</button>}
                <button onClick={() => setIsFilterOpen(false)} className="bg-gray-100 rounded-full w-8 h-8 font-bold">✕</button>
              </div>
            </div>
            <div className="p-5 space-y-6">

              {/* Жынысы */}
              <div>
                <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-gray-500">Кімге арналған</h4>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'Мужской', 'Женский', 'Унисекс'].map(g => (
                    <button key={g} onClick={() => setGenderFilter(g)}
                      className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${genderFilter === g ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {g === 'all' ? 'Барлығы' : g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Баға */}
              <div>
                <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-gray-500">Баға аралығы</h4>
                <div className="space-y-2">
                  <button onClick={() => setPriceRange('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold border transition-all ${priceRange === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    Кез келген
                  </button>
                  {PRICE_RANGES.map(r => (
                    <button key={r.label} onClick={() => setPriceRange(r.label)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold border transition-all ${priceRange === r.label ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Брендтер */}
              {availableBrands.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-gray-500">Бренд</h4>
                  <div className="flex gap-2 flex-wrap">
                    {availableBrands.map(b => (
                      <button key={b} onClick={() => toggleBrand(b)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedBrands.includes(b) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Көлем */}
              {availableVolumes.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-gray-500">Көлем (мл)</h4>
                  <div className="flex gap-2 flex-wrap">
                    {availableVolumes.map(v => (
                      <button key={v} onClick={() => toggleVolume(v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedVolumes.includes(v) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {v} мл
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 sticky bottom-0 bg-white border-t">
              <button onClick={() => setIsFilterOpen(false)}
                className="w-full bg-indigo-600 text-white font-black py-3.5 rounded-xl">
                Қолдану
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ПАРФЮМ МОДАЛІ */}
      {selectedPerfume && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedPerfume(null)}
              className="absolute top-4 right-4 bg-white shadow-lg p-2 rounded-full z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <div className="aspect-[4/3] overflow-hidden bg-gray-50">
              <img src={selectedPerfume.image_url} alt={selectedPerfume.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                {selectedPerfume.brand && <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">{selectedPerfume.brand}</p>}
                {selectedPerfume.gender && <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-md font-medium">{selectedPerfume.gender}</span>}
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">{selectedPerfume.name}</h2>
              <p className="text-gray-400 mb-3 text-sm">{selectedPerfume.volume} мл</p>
              <p className="text-3xl font-black text-indigo-600 mb-5">{getDisplayPrice(selectedPerfume.price).toLocaleString('kk-KZ')} ₸</p>

              {selectedPerfume.description && (
                <div className="mb-5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">Сипаттамасы</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedPerfume.description}</p>
                </div>
              )}

              {similarPerfumes.length > 0 && (
                <div className="mb-5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">Сізге ұнауы мүмкін</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {similarPerfumes.map(s => (
                      <div key={s.id} onClick={() => setSelectedPerfume(s)} className="cursor-pointer">
                        <div className="aspect-[4/5] rounded-xl overflow-hidden bg-gray-50 mb-1">
                          <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs font-bold text-gray-900 truncate">{s.name}</p>
                        <p className="text-[10px] text-indigo-600 font-bold">{getDisplayPrice(s.price).toLocaleString('kk-KZ')} ₸</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => { addToCart(selectedPerfume); setSelectedPerfume(null) }}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl text-base"
              >
                Себетке қосу
              </button>
            </div>
          </div>
        </div>
      )}

      {/* СЕБЕТ */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex justify-end">
          <div className="bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-black flex items-center gap-2">
                Себет <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-500 font-normal">{cartCount}</span>
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="bg-gray-100 rounded-full p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <p>Себетіңіз бос</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-50">
                    <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-xl bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {item.brand && <p className="text-[10px] text-indigo-500 font-bold uppercase">{item.brand}</p>}
                      <p className="font-bold text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.volume} мл • {getDisplayPrice(item.price).toLocaleString('kk-KZ')} ₸</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQty(item.id, -1)} className="bg-gray-100 w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center">−</button>
                        <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="bg-gray-100 w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center">+</button>
                        <button onClick={() => removeFromCart(item.id)} className="ml-auto text-red-500 text-xs font-bold">Өшіру</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t bg-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-gray-500">Жалпы сома:</span>
                  <span className="text-2xl font-black text-indigo-600">{cartTotal.toLocaleString('kk-KZ')} ₸</span>
                </div>
                <button
                  onClick={sendOrderToBot}
                  className="w-full bg-indigo-600 text-white text-lg font-black py-4 rounded-xl shadow-lg"
                >
                  Тапсырыс беру
                </button>
                <p className="text-center text-xs text-gray-400 mt-2">Ботқа заказ жіберіледі</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
