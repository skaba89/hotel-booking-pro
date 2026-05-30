'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Clock, TrendingUp, Users } from 'lucide-react';

const SOCIAL_PROOF_MESSAGES = [
  'Un client de Dakar vient de réserver une Suite Junior',
  'Un client de Paris vient de réserver une Chambre Supérieure',
  '3 personnes consultent nos chambres en ce moment',
  'La Suite Présidentielle a été réservée 2 fois cette semaine',
];

export function SocialProofBadge({ roomId }: { roomId?: string }) {
  const [viewers, setViewers] = useState(0);
  const [bookingsToday, setBookingsToday] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Simulate realistic numbers
    setViewers(Math.floor(Math.random() * 5) + 2);
    setBookingsToday(Math.floor(Math.random() * 3) + 1);
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, [roomId]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
          <Eye className="w-4 h-4 animate-pulse" />
          <span><strong>{viewers} personnes</strong> consultent cette chambre</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
          <TrendingUp className="w-4 h-4" />
          <span><strong>{bookingsToday} réservation(s)</strong> aujourd&apos;hui</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function LastBookedBadge() {
  const [show, setShow] = useState(false);
  const times = ['il y a 12 minutes', 'il y a 34 minutes', 'il y a 1 heure', 'il y a 2 heures'];
  const [time] = useState(times[Math.floor(Math.random() * times.length)]);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 text-xs text-muted-foreground"
    >
      <Clock className="w-3.5 h-3.5" />
      <span>Dernière réservation {time}</span>
    </motion.div>
  );
}

export function SocialProofToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(SOCIAL_PROOF_MESSAGES[Math.floor(Math.random() * SOCIAL_PROOF_MESSAGES.length)]);
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }, 25000);

    // Show first one after 8s
    const first = setTimeout(() => {
      setMessage(SOCIAL_PROOF_MESSAGES[0]);
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }, 8000);

    return () => { clearInterval(interval); clearTimeout(first); };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-6 z-50 bg-white shadow-xl rounded-xl px-4 py-3 border flex items-center gap-3 max-w-sm"
        >
          <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-gold" />
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
