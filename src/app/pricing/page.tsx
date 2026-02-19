'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EliteButton } from '@/components/ui/EliteButton';
import { EliteCard } from '@/components/ui/EliteCard';
import { EliteBadge } from '@/components/ui/EliteBadge';
import { useAuth } from '@/context/AuthContext';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import '../globals.css';

export default function Pricing() {
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const { isAuthenticated, refreshCredits } = useAuth();
    const router = useRouter();

    const PAYPAL_CLIENT_ID = "Afc2cT4XrOnJmxiBifQR_EBJjtGVICXJMtvF4zGiZqIaQ8sIy76-7DdCNHVqmbODzv3MTO63SjjMbW_2";

    const plans = [
        {
            id: 'starter',
            name: 'Starter Pack',
            price: '25',
            credits: '250',
            description: 'Para probar y crear tus primeros videos virales.',
            features: ['250 Créditos (~25 Videos Medios)', 'Soporte Básico', 'Generador Estándar']
        },
        {
            id: 'creator',
            name: 'Pro Creator',
            price: '49',
            credits: '500',
            description: 'El estándar para creadores de contenido consistentes.',
            features: ['500 Créditos (~50 Videos Medios)', 'Soporte Prioritario', 'Acceso a Herramientas Beta', 'Sin Marcas de Agua'],
            popular: true
        },
        {
            id: 'agency',
            name: 'Agency Elite',
            price: '99',
            credits: '1000',
            description: 'Poder masivo para agencias y automatización total.',
            features: ['1000 Créditos (~100 Videos Medios)', 'Soporte VIP 24/7', 'Acceso API (Próximamente)', 'Licencia Comercial'],
            popular: false
        }
    ];

    const handlePurchaseSuccess = (details: any) => {
        refreshCredits();

        alert(`🎉 ¡PAGO PROCESADO EXITOSAMENTE! \n\nGracias, ${details.payer.name.given_name}. Se han añadido ${selectedPlan.credits} tokens a tu cuenta de VERSION.`);
        router.push('/dashboard');
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
            <div className="min-h-screen bg-black text-white selection:bg-primary/30">
                {/* Navbar */}
                <nav className="container flex justify-between items-center py-8 border-b border-white/[0.04]">
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
                            <header className="text-center mb-20">
                                <span className="badge mb-4">Adquisición de Recursos</span>
                                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">RECARGA TU <span className="text-primary">ARSENAL</span></h1>
                                <p className="text-zinc-500 max-w-xl mx-auto font-medium">Selecciona el paquete de tokens que mejor se adapte a tu nivel de producción digital.</p>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                {plans.map((plan) => (
                                    <EliteCard
                                        key={plan.id}
                                        variant="glass"
                                        title={plan.name}
                                        subtitle={plan.popular ? "Recomendado" : "Depósito de Recursos"}
                                        description={plan.description}
                                        className={plan.popular ? 'border-primary/20 bg-primary/[0.02]' : ''}
                                        headerAction={plan.popular ? <EliteBadge variant="primary">Más Popular</EliteBadge> : null}
                                    >
                                        <div className="mb-10 mt-2">
                                            <div className="text-6xl font-black mb-2">${plan.price}<span className="text-xs text-zinc-500 font-normal">.USD</span></div>
                                            <div className="text-primary font-bold text-[10px] tracking-[0.3em] uppercase">{plan.credits} TOKENS</div>
                                        </div>

                                        <ul className="space-y-4 text-xs mb-12 text-left w-full border-t border-white/[0.04] pt-8">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3 font-medium text-zinc-400">
                                                    <span className="text-primary font-bold">✓</span> {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        <EliteButton
                                            variant={plan.popular ? "primary" : "outline"}
                                            fullWidth
                                            size="lg"
                                            onClick={() => handlePurchase(plan)}
                                        >
                                            Adquirir Arsenal
                                        </EliteButton>
                                    </EliteCard>
                                ))}
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
