'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Clock, BedDouble, CreditCard, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AVATAR_SRC = '/images/chatbot-avatar.jpg';

function BotAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 28 : size === 'md' ? 36 : 44;
  return (
    <div className={`${size === 'sm' ? 'w-7 h-7' : size === 'md' ? 'w-9 h-9' : 'w-11 h-11'} rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#C8A45D]/30`}>
      <Image src={AVATAR_SRC} alt="Assistante SETIFANA" width={dims} height={dims} className="w-full h-full object-cover" />
    </div>
  );
}

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  quickReplies?: string[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bonjour';
  if (hour >= 12 && hour < 18) return 'Bon apres-midi';
  return 'Bonsoir';
}

function getWelcomeMessage(): { text: string; quickReplies: string[] } {
  const greeting = getGreeting();
  return {
    text: `${greeting} et bienvenue a l'Hotel SETIFANA ! Je suis Amina, votre assistante virtuelle. Comment puis-je vous aider aujourd'hui ?`,
    quickReplies: ['Tarifs des chambres', 'Horaires', 'Services', 'Comment reserver ?'],
  };
}

const FAQ_RESPONSES: Record<string, { answer: string; quickReplies?: string[] }> = {
  bonjour: {
    answer: "Bonjour et bienvenue ! Je suis Amina, ravie de vous accueillir sur le site de l'Hotel SETIFANA. Je suis disponible pour repondre a toutes vos questions. Comment puis-je vous aider aujourd'hui ?",
    quickReplies: ['Tarifs des chambres', 'Horaires check-in/out', 'Services disponibles', 'Comment reserver ?'],
  },
  hello: {
    answer: "Hello and welcome! I'm Amina, delighted to have you on Hotel SETIFANA's website. I'm ready to help with any questions you may have. How can I assist you today?",
    quickReplies: ['Room rates', 'Check-in/out times', 'Available services', 'How to book?'],
  },
  tarif: {
    answer: "Nos tarifs commencent a partir de 450 000 GNF/nuit pour une Chambre Standard. Voici nos categories :\n\n- Chambre Standard : 450 000 GNF\n- Chambre Superieure : 650 000 GNF\n- Suite Junior : 950 000 GNF\n- Suite Presidentielle : 2 500 000 GNF\n- Chambre Familiale : 750 000 GNF\n- Chambre Business : 550 000 GNF\n\nTous les prix incluent le petit-dejeuner.",
    quickReplies: ['Reserver maintenant', 'Voir les chambres', 'Offres speciales'],
  },
  prix: {
    answer: "Nos tarifs commencent a partir de 450 000 GNF/nuit pour une Chambre Standard. Voici nos categories :\n\n- Chambre Standard : 450 000 GNF\n- Chambre Superieure : 650 000 GNF\n- Suite Junior : 950 000 GNF\n- Suite Presidentielle : 2 500 000 GNF\n- Chambre Familiale : 750 000 GNF\n- Chambre Business : 550 000 GNF\n\nTous les prix incluent le petit-dejeuner.",
    quickReplies: ['Reserver maintenant', 'Voir les chambres', 'Offres speciales'],
  },
  'check-in': {
    answer: "Nos horaires sont :\n\n- Check-in : a partir de 14h00\n- Check-out : avant 12h00\n\nUn early check-in (des 10h) ou un late check-out (jusqu'a 16h) peuvent etre arranges selon disponibilite (supplement de 50 000 GNF).",
    quickReplies: ['Tarifs', 'Services', 'Reserver'],
  },
  horaire: {
    answer: "Nos horaires sont :\n\n- Check-in : a partir de 14h00\n- Check-out : avant 12h00\n- Restaurant : 6h30-22h00\n- Piscine : 7h00-21h00\n- Spa : 9h00-20h00\n- Salle de sport : 6h00-22h00",
    quickReplies: ['Tarifs', 'Services', 'Reserver'],
  },
  service: {
    answer: "L'Hotel SETIFANA offre de nombreux services premium :\n\n- Piscine exterieure chauffee\n- Restaurant gastronomique\n- Spa & bien-etre\n- Salle de conference (100 pers.)\n- Salle de sport equipee\n- WiFi haut debit gratuit\n- Service de navette aeroport\n- Room service 24h/24\n- Parking securise gratuit\n- Blanchisserie express",
    quickReplies: ['Tarifs', 'Reserver', 'Piscine', 'Restaurant'],
  },
  reserver: {
    answer: "Pour reserver, vous avez plusieurs options :\n\n1. En ligne : Cliquez sur 'Reserver' sur notre site\n2. Par telephone : +224 666 05 76 20\n3. Par WhatsApp : +224 666 05 76 20\n4. Par email : reservation@setifana.com\n\nLa reservation en ligne est instantanee et vous recevrez une confirmation par email.",
    quickReplies: ['Tarifs', 'Modes de paiement', 'Annulation'],
  },
  paiement: {
    answer: "Nous acceptons plusieurs modes de paiement :\n\n- Carte bancaire (Visa, Mastercard)\n- Orange Money / MTN Mobile Money\n- Virement bancaire\n- Paiement a l'arrivee\n\nToutes les transactions en ligne sont securisees (SSL 256-bit).",
    quickReplies: ['Reserver', 'Annulation', 'Tarifs'],
  },
  annulation: {
    answer: "Notre politique d'annulation :\n\n- Annulation gratuite jusqu'a 48h avant l'arrivee\n- Annulation entre 24h-48h : 50% du montant\n- Annulation moins de 24h : 100% du montant\n- No-show : 100% du montant\n\nLes offres speciales peuvent avoir des conditions differentes.",
    quickReplies: ['Reserver', 'Modes de paiement', 'Contact'],
  },
  piscine: {
    answer: "Notre piscine exterieure est ouverte de 7h00 a 21h00 tous les jours. Elle fait 25m de long et est chauffee. Des serviettes sont fournies gratuitement. Un bar de piscine est disponible pour les boissons et snacks.",
    quickReplies: ['Autres services', 'Tarifs', 'Restaurant'],
  },
  restaurant: {
    answer: "Notre restaurant gastronomique 'Le Palmier' propose :\n\n- Petit-dejeuner buffet : 6h30-10h00 (inclus)\n- Dejeuner : 12h00-14h30\n- Diner : 19h00-22h00\n\nCuisine internationale et specialites guineennes. Menu enfants disponible. Reservation recommandee pour le diner.",
    quickReplies: ['Services', 'Tarifs', 'Reserver'],
  },
  localisation: {
    answer: "L'Hotel SETIFANA est situe a la Baie de Sangarea, Conakry, Guinee.\n\nAdresse : H8XV+659 Baie de Sangarea, Conakry, Guinee\n\n- 25 min de l'aeroport international AST\n- 20 min du centre-ville de Conakry\n- Vue sur la Baie de Sangarea\n\nUn service de navette aeroport est disponible (sur reservation).",
    quickReplies: ['Navette aeroport', 'Reserver', 'Contact'],
  },
  contact: {
    answer: "Contactez-nous :\n\n- Telephone : +224 666 05 76 20\n- WhatsApp : +224 666 05 76 20\n- Email : info@setifana.com\n- Reservations : reservation@setifana.com\n\nNotre equipe est disponible 24h/24 pour vous assister.",
    quickReplies: ['Reserver', 'Tarifs', 'Localisation'],
  },
  wifi: {
    answer: "Le WiFi haut debit est gratuit et disponible dans tout l'hotel (chambres, lobby, restaurant, piscine). Debit : jusqu'a 100 Mbps. Les chambres Business beneficient d'une connexion premium dediee.",
    quickReplies: ['Services', 'Chambres Business', 'Tarifs'],
  },
  navette: {
    answer: "Notre service de navette aeroport :\n\n- Aeroport -> Hotel : 150 000 GNF\n- Hotel -> Aeroport : 150 000 GNF\n- Aller-retour : 250 000 GNF\n\nReservation 24h a l'avance recommandee. Vehicule climatise avec chauffeur.",
    quickReplies: ['Reserver', 'Localisation', 'Contact'],
  },
  spa: {
    answer: "Notre espace Spa & Bien-etre propose :\n\n- Massages (60-90 min)\n- Soins du visage\n- Hammam\n- Sauna\n\nOuvert de 9h00 a 20h00. Reservation sur place ou par telephone. Reduction de 10% pour les clients de l'hotel.",
    quickReplies: ['Services', 'Tarifs', 'Reserver'],
  },
  offre: {
    answer: "Nos offres speciales en cours :\n\n- Sejour Longue Duree : -20% des 7 nuits\n- Early Bird : -15% en reservant 30j a l'avance\n- Week-end Romantique : Package couple complet\n- Offre Business : -10% + salle de conf\n- Famille en Or : Enfants -12 ans gratuits\n- Derniere Minute : Jusqu'a -25%",
    quickReplies: ['Reserver', 'Tarifs', 'Voir les offres'],
  },
};

function findBestResponse(input: string): { answer: string; quickReplies?: string[] } {
  const normalized = input.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

  // Direct keyword matching
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    if (normalized.includes(key)) {
      return response;
    }
  }

  // Contextual matching
  if (normalized.match(/chambre|room|suite|lit|bed/)) return FAQ_RESPONSES.tarif;
  if (normalized.match(/heure|quand|arrivee|depart|checkout/)) return FAQ_RESPONSES['check-in'];
  if (normalized.match(/payer|carte|money|visa|mobile/)) return FAQ_RESPONSES.paiement;
  if (normalized.match(/ou|adresse|trouver|situe|location|map/)) return FAQ_RESPONSES.localisation;
  if (normalized.match(/tel|appeler|numero|whatsapp|email|mail/)) return FAQ_RESPONSES.contact;
  if (normalized.match(/manger|dejeuner|diner|cuisine|menu/)) return FAQ_RESPONSES.restaurant;
  if (normalized.match(/nager|baigner|eau/)) return FAQ_RESPONSES.piscine;
  if (normalized.match(/massage|detente|sauna|hammam|soin/)) return FAQ_RESPONSES.spa;
  if (normalized.match(/internet|connexion/)) return FAQ_RESPONSES.wifi;
  if (normalized.match(/aeroport|taxi|transport|voiture/)) return FAQ_RESPONSES.navette;
  if (normalized.match(/promotion|reduction|discount|promo|special/)) return FAQ_RESPONSES.offre;
  if (normalized.match(/annuler|rembours|cancel/)) return FAQ_RESPONSES.annulation;
  if (normalized.match(/reserve|book|disponib/)) return FAQ_RESPONSES.reserver;
  if (normalized.match(/merci|thank/)) return { answer: "Je vous en prie ! C'etait un plaisir de vous aider. N'hesitez pas si vous avez d'autres questions, l'equipe SETIFANA est toujours a votre service.", quickReplies: ['Tarifs', 'Services', 'Reserver'] };
  if (normalized.match(/salut|hey|bonsoir|bonne/)) {
    const g = getGreeting();
    return { answer: `${g} ! Je suis Amina, ravie de vous accueillir a l'Hotel SETIFANA. Je suis la pour vous accompagner. Que puis-je faire pour vous ?`, quickReplies: ['Tarifs des chambres', 'Horaires', 'Services', 'Comment reserver ?'] };
  }

  return {
    answer: "Je ne suis pas sur de comprendre votre question. Voici les sujets sur lesquels je peux vous aider :\n\n- Tarifs et chambres\n- Services de l'hotel\n- Reservation\n- Horaires\n- Localisation\n- Paiements\n\nVous pouvez aussi nous contacter au +224 666 05 76 20.",
    quickReplies: ['Tarifs', 'Services', 'Reserver', 'Contact'],
  };
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const welcome = getWelcomeMessage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: welcome.text,
      sender: 'bot',
      timestamp: new Date(),
      quickReplies: welcome.quickReplies,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-greeting bubble after 3 seconds
  useEffect(() => {
    const alreadyGreeted = sessionStorage.getItem('chatbot_greeted');
    if (alreadyGreeted || isOpen) return;

    const timer = setTimeout(() => {
      setShowBubble(true);
      sessionStorage.setItem('chatbot_greeted', '1');
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Hide bubble when chat opens
  useEffect(() => {
    if (isOpen) {
      setShowBubble(false);
      setBubbleDismissed(true);
    }
  }, [isOpen]);

  // Auto-hide bubble after 12 seconds
  useEffect(() => {
    if (!showBubble) return;
    const timer = setTimeout(() => {
      setShowBubble(false);
      setBubbleDismissed(true);
    }, 12000);
    return () => clearTimeout(timer);
  }, [showBubble]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };

    // Build the conversation history to send to the AI. Drop the leading
    // assistant welcome turn(s) so the sequence starts with a user message
    // (required by some providers, e.g. Anthropic), keep the last 10 turns,
    // and cap each message length to satisfy the API DTO.
    let turns = [...messages, userMsg].map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.text.slice(0, 2000),
    }));
    const firstUser = turns.findIndex((t) => t.role === 'user');
    turns = (firstUser >= 0 ? turns.slice(firstUser) : turns).slice(-10);

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // The static FAQ is always our offline/fallback brain; suggested quick
    // replies come from it so the UX stays consistent even with AI answers.
    const fallback = findBestResponse(trimmed);
    let answer = '';
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: turns }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.reply === 'string' && data.reply.trim()) {
          answer = data.reply.trim();
        }
      }
    } catch {
      // network error -> fall back to FAQ below
    }
    if (!answer) answer = fallback.answer;

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: answer,
      sender: 'bot',
      timestamp: new Date(),
      quickReplies: fallback.quickReplies,
    };
    setMessages((prev) => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  return (
    <>
      {/* Greeting Bubble */}
      <AnimatePresence>
        {showBubble && !isOpen && !bubbleDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-24 left-6 z-50 max-w-[300px]"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 cursor-pointer hover:shadow-3xl transition-shadow"
              onClick={() => { setShowBubble(false); setBubbleDismissed(true); setIsOpen(true); }}
            >
              <div className="flex items-start gap-3">
                <BotAvatar size="md" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#071B33] mb-1">Amina - Assistante SETIFANA</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {getGreeting()} ! Je suis Amina, bienvenue a l&apos;Hotel SETIFANA. Puis-je vous aider dans votre recherche ?
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-[#C8A45D]/10 text-[#071B33] rounded-full border border-[#C8A45D]/20">Nos chambres</span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#C8A45D]/10 text-[#071B33] rounded-full border border-[#C8A45D]/20">Reserver</span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#C8A45D]/10 text-[#071B33] rounded-full border border-[#C8A45D]/20">Tarifs</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowBubble(false); setBubbleDismissed(true); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 -mt-1 -mr-1"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Arrow pointing to the button */}
            <div className="ml-6 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45 -mt-2"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 left-6 z-50 w-16 h-16 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform group overflow-visible"
            aria-label="Ouvrir le chat avec Amina"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden ring-3 ring-[#C8A45D] shadow-lg">
              <Image src={AVATAR_SRC} alt="Amina - Assistante" width={64} height={64} className="w-full h-full object-cover" />
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <MessageCircle className="w-2.5 h-2.5 text-white" />
            </span>
            {/* Pulse ring when bubble is showing */}
            {showBubble && (
              <span className="absolute inset-0 rounded-full bg-[#C8A45D]/30 animate-ping" />
            )}
            {/* Tooltip */}
            <span className="absolute left-full ml-3 bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Discuter avec Amina
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="bg-[#071B33] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <BotAvatar size="lg" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#071B33]"></span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Amina</p>
                  <p className="text-white/40 text-[10px]">Assistante SETIFANA</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-white/60 text-[11px]">En ligne</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-1' : ''}`}>
                    <div className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      {msg.sender === 'bot' && (
                        <BotAvatar size="sm" />
                      )}
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                          msg.sender === 'user'
                            ? 'bg-[#071B33] text-white rounded-br-sm'
                            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                    {/* Quick Replies */}
                    {msg.sender === 'bot' && msg.quickReplies && (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                        {msg.quickReplies.map((reply) => (
                          <button
                            key={reply}
                            onClick={() => handleQuickReply(reply)}
                            className="text-xs px-3 py-1.5 bg-white border border-[#C8A45D]/30 text-[#071B33] rounded-full hover:bg-[#C8A45D]/10 hover:border-[#C8A45D] transition-colors"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-end gap-2">
                  <BotAvatar size="sm" />
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Topics */}
            <div className="px-4 py-2 bg-white border-t border-gray-100">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <QuickTopic icon={BedDouble} label="Chambres" onClick={() => sendMessage('Tarifs des chambres')} />
                <QuickTopic icon={Clock} label="Horaires" onClick={() => sendMessage('Horaires')} />
                <QuickTopic icon={CreditCard} label="Paiement" onClick={() => sendMessage('Modes de paiement')} />
                <QuickTopic icon={MapPin} label="Acces" onClick={() => sendMessage('Localisation')} />
                <QuickTopic icon={Phone} label="Contact" onClick={() => sendMessage('Contact')} />
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question..."
                  className="flex-1 text-sm rounded-full bg-gray-50 border-gray-200 focus:border-[#C8A45D] focus:ring-[#C8A45D]/20"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-9 h-9 rounded-full bg-[#071B33] hover:bg-[#0a2545] p-0 flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function QuickTopic({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-[11px] text-gray-600 hover:bg-[#C8A45D]/10 hover:border-[#C8A45D]/30 hover:text-[#071B33] transition-colors whitespace-nowrap flex-shrink-0"
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}
