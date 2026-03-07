'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EliteButton } from '@/components/ui/EliteButton';
import { EliteCard } from '@/components/ui/EliteCard';
import { EliteBadge } from '@/components/ui/EliteBadge';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function Pricing() {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const { isAuthenticated, refreshCredits, user } = useAuth();
    const router = useRouter();

    const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "Afc2cT4XrOnJmxiBifQR_EBJjtGVICXJMtvF4zGiZqIaQ8sIy76-7DdCNHVqmbODzv3MTO63SjjMbW_2";

    const plans = [
        {
            id: 'starter',
            name: 'Starter Pack',
            monthlyPrice: 25,
            yearlyPrice: 240,
            credits: 250,
            description: 'Para probar y crear tus primeros videos virales.',
            features: ['250 Créditos / Mes', 'Soporte Básico', 'Generador Estándar']
        },
        {
            id: 'creator',
            name: 'Pro Creator',
            monthlyPrice: 49,
            yearlyPrice: 470,
            credits: 500,
            description: 'El estándar para creadores de contenido consistentes.',
            features: ['500 Créditos / Mes', 'Soporte Prioritario', 'Acceso a Herramientas Beta', 'Sin Marcas de Agua'],
            popular: true
        },
        {
            id: 'agency',
            name: 'Agency Elite',
            monthlyPrice: 99,
            yearlyPrice: 950,
            credits: 1000,
            description: 'Poder masivo para agencias y automatización total.',
            features: ['1000 Créditos / Mes', 'Soporte VIP 24/7', 'Acceso API (Próximamente)', 'Licencia Comercial'],
            popular: false
        }
    ];

    const topups = [
        { id: 'pack_100', name: 'Pack 100', credits: 100, price: 10 },
        { id: 'pack_500', name: 'Pack 500', credits: 500, price: 40, popular: true },
        { id: 'pack_1000', name: 'Pack 1000', credits: 1000, price: 70 }
    ];

    const handlePurchaseSuccess = async (details: any) => {
        try {
            // Confirmar el pago en el backend y añadir créditos
            // Determinar el ID real del plan (mensual, anual o recarga)
            let planId = selectedPlan.id;
            if (selectedPlan.monthlyPrice) { // Es un plan, no una recarga
                planId = `${selectedPlan.id}_${billingPeriod}`;
            }

            const result = await apiFetch<{ success: boolean; credits: number; added: number }>('/payments/confirm', {
                method: 'POST',
                body: JSON.stringify({
                    plan_id: planId,
                    order_id: details.id
                })
            });

            if (result.success) {
                refreshCredits();
                alert(`🎉 ¡PAGO PROCESADO! Se añadieron ${result.added} tokens a tu cuenta. Total: ${result.credits}`);
                router.push('/dashboard');
            } else {
                alert('Error al procesar el pago. Contacta soporte.');
            }
        } catch (err) {
            console.error('Error confirmando pago:', err);
            alert('Error al confirmar el pago con el servidor. Contacta soporte.');
        }
    };

    const handlePurchase = (plan: any) => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        setSelectedPlan(plan);
    };

    return (
        <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD" }}>
            <div className="min-h-screen text-white selection:bg-primary/30 relative" style={{ background: 'var(--background)' }}>
                {/* Glass Orbs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-1/3 left-1/3 w-[450px] h-[450px] bg-primary/5 blur-[160px] rounded-full animate-orb-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-500/5 blur-[140px] rounded-full animate-orb-float" style={{ animationDelay: '-9s' }} />
                </div>
                {/* Navbar */}
                <nav className="container flex justify-between items-center py-8 relative z-10" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <Link href="/" className="text-2xl font-black tracking-tighter uppercase">
                        VERSION<span className="text-primary">.</span>
                    </Link>
                    <div className="flex gap-6 items-center">
                        <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-all">Panel Control</Link>
                        <Link href="/" className="btn-outline !py-2.5 !px-5 !text-[9px]">Salir</Link>
                    </div>
                </nav>

                <main className="container py-24">
                    {!selectedPlan ? (
                        <div className="animate-fade">
                            <header className="text-center mb-12">
                                <span className="badge mb-4 uppercase tracking-widest text-[9px]">Ecosistema VERSION</span>
                                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">RECARGA TU <span className="text-primary">ARSENAL</span></h1>
                                <p className="text-zinc-500 max-w-xl mx-auto font-medium text-sm md:text-base">Selecciona el nivel de potencia que requiere tu producción digital.</p>

                                {/* Toggle Facturación */}
                                <div className="mt-12 flex items-center justify-center gap-4">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${billingPeriod === 'monthly' ? 'text-white' : 'text-zinc-600'}`}>Mensual</span>
                                    <button
                                        onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                                        className="relative w-14 h-7 bg-white/5 border border-white/10 rounded-full p-1 transition-all hover:border-primary/30"
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-primary rounded-full transition-all shadow-lg shadow-primary/20 ${billingPeriod === 'monthly' ? 'left-1' : 'left-8'}`} />
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${billingPeriod === 'yearly' ? 'text-white' : 'text-zinc-600'}`}>Anual</span>
                                        <span className="bg-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded-full border border-primary/20 uppercase">Ahorra 20%</span>
                                    </div>
                                </div>
                            </header>

                            {/* Planes Principales */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
                                {plans.map((plan) => {
                                    const currentPrice = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                                    const displayPrice = billingPeriod === 'monthly' ? currentPrice : Math.round(currentPrice / 12);

                                    return (
                                        <EliteCard
                                            key={plan.id}
                                            variant="glass"
                                            title={plan.name}
                                            subtitle={plan.popular ? "Máxima Velocidad" : "Base de Operaciones"}
                                            description={plan.description}
                                            className={plan.popular ? 'border-primary/20 bg-primary/[0.02] -translate-y-2' : ''}
                                            headerAction={plan.popular ? <EliteBadge variant="primary">Más Escogido</EliteBadge> : null}
                                        >
                                            <div className="mb-10 mt-2">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-zinc-500">$</span>
                                                    <span className="text-6xl font-black tracking-tighter">{displayPrice}</span>
                                                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">/mes</span>
                                                </div>
                                                {billingPeriod === 'yearly' && (
                                                    <div className="text-[10px] text-zinc-500 font-bold mt-2 uppercase tracking-widest">
                                                        Facturado anualmente (${currentPrice})
                                                    </div>
                                                )}
                                                <div className="text-primary font-bold text-[10px] tracking-[0.3em] uppercase mt-4 flex items-center justify-center gap-2">
                                                    <span className="w-8 h-[1px] bg-primary/20"></span>
                                                    {plan.credits} TOKENS / MES
                                                    <span className="w-8 h-[1px] bg-primary/20"></span>
                                                </div>
                                            </div>

                                            <ul className="space-y-4 text-[11px] mb-12 text-left w-full border-t border-white/[0.04] pt-8">
                                                {plan.features.map((feature, i) => (
                                                    <li key={i} className="flex items-center gap-3 font-semibold text-zinc-400 capitalize">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"></div>
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>

                                            <EliteButton
                                                variant={plan.popular ? "primary" : "outline"}
                                                fullWidth
                                                size="lg"
                                                onClick={() => handlePurchase({ ...plan, price: currentPrice })}
                                                className="!rounded-2xl"
                                            >
                                                {billingPeriod === 'monthly' ? 'Adquirir Mensual' : 'Suscripción Anual'}
                                            </EliteButton>
                                        </EliteCard>
                                    );
                                })}
                            </div>

                            {/* Sección Recargas */}
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center gap-4 mb-10 overflow-hidden">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500">¿Necesitas más potencia? Recargas rápidas</h2>
                                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {topups.map((pack) => (
                                        <div
                                            key={pack.id}
                                            onClick={() => handlePurchase(pack)}
                                            className="group relative cursor-pointer"
                                        >
                                            <div className={`absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all ${pack.popular ? 'opacity-30' : ''}`}></div>
                                            <div className={`relative p-6 rounded-3xl border transition-all ${pack.popular ? 'bg-primary/5 border-primary/30' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="text-xs font-black text-primary uppercase tracking-widest">⚡ {pack.credits}</div>
                                                    <div className="text-xl font-black">${pack.price}</div>
                                                </div>
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-left mb-6">Tokens de un solo uso</p>
                                                <div className="text-[9px] font-black text-white/40 group-hover:text-primary transition-colors text-right flex items-center justify-end gap-2">
                                                    COMPRAR AHORA
                                                    <span className="text-lg">→</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto animate-fade">
                            <button
                                onClick={() => setSelectedPlan(null)}
                                className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white mb-12 transition-colors rounded-full px-4 py-2 hover:bg-white/[0.05]"
                            >
                                ← Volver a Planes
                            </button>

                            <div className="space-y-6">
                                {/* Order Summary */}
                                <div className="glass-card !p-8 border-primary/20 flex flex-col md:flex-row justify-between items-center gap-8">
                                    <div>
                                        <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Orden de Compra</div>
                                        <h2 className="text-2xl font-black uppercase tracking-tighter">{selectedPlan.name} — {selectedPlan.credits} TOKENS</h2>
                                    </div>
                                    <div className="text-4xl font-black">${selectedPlan.price} USD</div>
                                </div>

                                {/* PayPal Integration */}
                                <div className="glass-card flex flex-col items-center justify-center py-12 bg-zinc-950/50">
                                    <div className="w-full max-w-md">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-10 text-center">Finalizar Pago Seguro con PayPal</h3>

                                        <PayPalButtons
                                            style={{
                                                layout: "vertical",
                                                color: "gold",
                                                shape: "pill",
                                                label: "pay"
                                            }}
                                            createOrder={(data, actions) => {
                                                return actions.order.create({
                                                    intent: "CAPTURE",
                                                    purchase_units: [
                                                        {
                                                            description: `${selectedPlan.name} - VERSION`,
                                                            amount: {
                                                                currency_code: "USD",
                                                                value: selectedPlan.price,
                                                            },
                                                        },
                                                    ],
                                                });
                                            }}
                                            onApprove={async (data, actions) => {
                                                if (actions.order) {
                                                    const details = await actions.order.capture();
                                                    handlePurchaseSuccess(details);
                                                }
                                            }}
                                            onError={(err) => {
                                                console.error("PayPal Error:", err);
                                                alert("Ocurrió un error con el pago de PayPal. Por favor, intenta de nuevo.");
                                            }}
                                        />

                                        <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest text-center mt-12">
                                            🔒 Transacción Protegida por la Red Encriptada de PayPal
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </PayPalScriptProvider>
    );
}
