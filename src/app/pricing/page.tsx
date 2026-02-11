'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import '../globals.css';

export default function Pricing() {
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    const PAYPAL_CLIENT_ID = "Afc2cT4XrOnJmxiBifQR_EBJjtGVICXJMtvF4zGiZqIaQ8sIy76-7DdCNHVqmbODzv3MTO63SjjMbW_2";

    useEffect(() => {
        const role = localStorage.getItem('version_user_role');
        setIsLoggedIn(!!role);
    }, []);

    const plans = [
        {
            id: 'starter',
            name: 'Basic Token Pack',
            price: '15',
            credits: '500',
            description: 'Ideal para creadores que inician su automatización.',
            features: ['500 Créditos de Generación', 'Soporte Estándar', 'Acceso al Ecosistema']
        },
        {
            id: 'elite',
            name: 'Elite Access Pack',
            price: '29',
            credits: '1000',
            description: 'Potencia total para dominar los algoritmos.',
            features: ['1.000 Créditos (100 Videos)', 'Soporte Mastermind 24/7', 'Acceso Academia VIP', 'Discord Exclusivo'],
            popular: true
        }
    ];

    const handlePurchaseSuccess = (details: any) => {
        const currentCredits = parseInt(localStorage.getItem('version_user_credits') || '0');
        const newCredits = currentCredits + parseInt(selectedPlan.credits);
        localStorage.setItem('version_user_credits', newCredits.toString());

        alert(`🎉 ¡PAGO PROCESADO EXITOSAMENTE! \n\nGracias, ${details.payer.name.given_name}. Se han añadido ${selectedPlan.credits} tokens a tu cuenta.`);
        router.push('/dashboard');
    };

    const handlePurchase = (plan: any) => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }
        setSelectedPlan(plan);
    };

    return (
        <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD" }}>
            <div className="min-h-screen bg-black text-white selection:bg-primary/30">
                {/* Navbar */}
                <nav className="container flex justify-between items-center py-8 border-b border-white/5">
                    <Link href="/" className="text-2xl font-black tracking-tighter uppercase">
                        VERSION<span className="text-primary">.</span>
                    </Link>
                    <div className="flex gap-8 items-center">
                        <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all">Panel Control</Link>
                        <Link href="/" className="btn-outline !py-2 !px-4 !text-[9px]">Salir</Link>
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
                                    <div
                                        key={plan.id}
                                        className={`glass-card flex flex-col items-center text-center group transition-all duration-500 hover:scale-[1.02] ${plan.popular ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''}`}
                                    >
                                        {plan.popular && (
                                            <div className="bg-primary text-white text-[8px] font-black px-4 py-1 tracking-[0.3em] uppercase mb-6 -mt-2">Recomendado</div>
                                        )}
                                        <h3 className={`text-sm font-bold uppercase tracking-[0.3em] mb-8 ${plan.popular ? 'text-primary' : 'text-zinc-500'}`}>{plan.name}</h3>
                                        <div className="text-6xl font-black mb-2">${plan.price}<span className="text-xs text-zinc-500 font-normal">.USD</span></div>
                                        <div className="text-primary font-black text-[10px] tracking-widest uppercase mb-10">{plan.credits} TOKENS ({parseInt(plan.credits) / 10} VIDEOS)</div>

                                        <ul className="space-y-4 text-xs mb-12 text-left w-full border-t border-white/5 pt-8">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    <span className="text-primary">✓</span> {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => handlePurchase(plan)}
                                            className={`${plan.popular ? 'btn-primary' : 'btn-outline'} w-full !py-4 !text-[10px] uppercase tracking-[0.2em] font-black`}
                                        >
                                            Adquirir Tokens
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto animate-fade-in">
                            <button
                                onClick={() => setSelectedPlan(null)}
                                className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white mb-12 transition-colors"
                            >
                                ← Volver a Planes
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                {/* Order Summary */}
                                <div className="lg:col-span-12 glass-card !p-8 border-primary/30 flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                                    <div>
                                        <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Orden de Compra</div>
                                        <h2 className="text-2xl font-black uppercase tracking-tighter">{selectedPlan.name} — {selectedPlan.credits} TOKENS</h2>
                                    </div>
                                    <div className="text-4xl font-black">${selectedPlan.price} USD</div>
                                </div>

                                {/* PayPal Integration */}
                                <div className="lg:col-span-12 flex flex-col items-center justify-center py-12 glass-card bg-zinc-950/50">
                                    <div className="w-full max-w-md">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-10 text-center">Finalizar Pago Seguro con PayPal</h3>

                                        <PayPalButtons
                                            style={{
                                                layout: "vertical",
                                                color: "gold",
                                                shape: "rect",
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
