'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Plane, MapPin, Clock, Users, CheckCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const vehicleTypes = [
  { id: 'sedan', name: 'Berline', capacity: 3, price: 150000, image: '🚗', description: 'Confortable pour 1-3 passagers' },
  { id: 'suv', name: 'SUV Premium', capacity: 5, price: 250000, image: '🚙', description: 'Spacieux pour familles' },
  { id: 'van', name: 'Van VIP', capacity: 8, price: 400000, image: '🚐', description: 'Ideal pour groupes' },
  { id: 'luxury', name: 'Luxe', capacity: 3, price: 500000, image: '����️', description: 'Mercedes/BMW classe E' },
];

const routes = [
  { id: 'airport-hotel', label: 'Aeroport → Hotel', price: 1.0 },
  { id: 'hotel-airport', label: 'Hotel → Aeroport', price: 1.0 },
  { id: 'roundtrip', label: 'Aller-Retour', price: 1.7 },
  { id: 'city-tour', label: 'City Tour (4h)', price: 2.5 },
];

export default function TransfersPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    route: 'airport-hotel',
    vehicle: 'sedan',
    date: '',
    time: '',
    passengers: 1,
    flightNumber: '',
    name: '',
    phone: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const selectedVehicle = vehicleTypes.find(v => v.id === form.vehicle)!;
  const selectedRoute = routes.find(r => r.id === form.route)!;
  const totalPrice = selectedVehicle.price * selectedRoute.price;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <Car className="w-12 h-12 text-gold mx-auto mb-4" />
            <h1 className="font-serif text-4xl font-bold text-white mb-3">Transfert Reserve !</h1>
          </div>
        </section>
        <section className="container mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-green-800 mb-2">Demande envoyee !</h2>
                <p className="text-sm text-green-700 mb-4">
                  Notre equipe confirmera votre transfert sous 30 minutes. Vous recevrez un SMS/WhatsApp de confirmation.
                </p>
                <div className="bg-white rounded-lg p-4 text-left space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Trajet:</span><span className="font-medium">{selectedRoute.label}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Vehicule:</span><span className="font-medium">{selectedVehicle.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Date:</span><span className="font-medium">{form.date} a {form.time}</span></div>
                  <div className="flex justify-between border-t pt-2"><span className="text-gray-500">Total:</span><span className="font-bold text-lg">{totalPrice.toLocaleString('fr-FR')} GNF</span></div>
                </div>
                <a href="tel:+224666057620" className="inline-flex items-center gap-2 mt-4 text-sm text-green-700 hover:underline">
                  <Phone className="w-4 h-4" /> Appeler pour confirmation immediate
                </a>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <Car className="w-12 h-12 text-gold mx-auto mb-4" />
          <h1 className="font-serif text-4xl font-bold text-white mb-3">Transfert & Transport</h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Service de navette aeroport et transferts prives. Vehicules climatises, chauffeurs professionnels.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-[#C8A45D] text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[#C8A45D]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Route & Vehicle */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-[#C8A45D]" /> Choisissez votre trajet</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {routes.map((route) => (
                        <button
                          key={route.id}
                          type="button"
                          onClick={() => setForm({ ...form, route: route.id })}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${form.route === route.id ? 'border-[#C8A45D] bg-[#C8A45D]/5' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <p className="font-medium text-sm">{route.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">x{route.price} du prix de base</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><Car className="w-4 h-4 text-[#C8A45D]" /> Choisissez votre vehicule</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {vehicleTypes.map((vehicle) => (
                        <button
                          key={vehicle.id}
                          type="button"
                          onClick={() => setForm({ ...form, vehicle: vehicle.id })}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${form.vehicle === vehicle.id ? 'border-[#C8A45D] bg-[#C8A45D]/5' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{vehicle.image}</span>
                            <div>
                              <p className="font-medium text-sm">{vehicle.name}</p>
                              <p className="text-xs text-gray-500">{vehicle.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400"><Users className="w-3 h-3 inline" /> {vehicle.capacity} max</span>
                                <span className="text-xs font-bold text-[#C8A45D]">{vehicle.price.toLocaleString('fr-FR')} GNF</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button variant="gold" size="lg" onClick={() => setStep(2)}>Continuer</Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Date & Details */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-[#C8A45D]" /> Details du trajet</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Date *</label>
                        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Heure *</label>
                        <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Passagers</label>
                        <Input type="number" min="1" max={selectedVehicle.capacity} value={form.passengers} onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">N° de vol (optionnel)</label>
                        <Input value={form.flightNumber} onChange={(e) => setForm({ ...form, flightNumber: e.target.value })} placeholder="AF 1234" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Notes supplementaires</label>
                      <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Bagages volumineux, siege bebe..." className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>Retour</Button>
                  <Button variant="gold" size="lg" onClick={() => setStep(3)} disabled={!form.date || !form.time}>Continuer</Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Contact & Confirm */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-[#C8A45D]" /> Vos coordonnees</h3>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Nom complet *</label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Votre nom" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Telephone / WhatsApp *</label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+224 6XX XXX XXX" />
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3">Recapitulatif</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Trajet</span><span>{selectedRoute.label}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Vehicule</span><span>{selectedVehicle.name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{form.date} a {form.time}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Passagers</span><span>{form.passengers}</span></div>
                      {form.flightNumber && <div className="flex justify-between"><span className="text-gray-500">Vol</span><span>{form.flightNumber}</span></div>}
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-xl text-[#C8A45D]">{totalPrice.toLocaleString('fr-FR')} GNF</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>Retour</Button>
                  <Button variant="gold" size="lg" type="submit" disabled={!form.name || !form.phone}>
                    Confirmer la reservation
                  </Button>
                </div>
              </motion.div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
