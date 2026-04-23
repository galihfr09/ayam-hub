import { Link } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bird } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-8 flex flex-col items-center">
      <div className="space-y-4 text-center mt-12 mb-8">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-slate-800">
          AyamHub<span className="text-amber-500">.</span>
        </h1>
        <p className="mx-auto max-w-[600px] text-slate-500 md:text-lg">
          Platform kalkulator cerdas untuk peternak cerdas. Hitung formulasi nutrisi yang tepat dan proyeksikan kebutuhan pasokan pakan rutin secara otomatis.
        </p>
      </div>

      <div className="w-full max-w-lg mt-8">
        <Link to="/formulasi-pakan" className="group block">
          <Card className="h-full bg-white rounded-3xl shadow-md shadow-amber-100 border border-amber-200 p-4 transition-all hover:shadow-xl hover:shadow-amber-200 hover:-translate-y-1">
            <CardHeader className="text-center space-y-6 flex flex-col items-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                <Bird className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-slate-800">Mulai Kalkulator Terpadu</CardTitle>
                <CardDescription className="text-base text-slate-500 font-medium max-w-xs mx-auto">
                  Rancang formula komposisi pakan dan estimasikan kebutuhan harian dan bulanan populasi Anda.
                </CardDescription>
              </div>
              
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 text-lg rounded-xl mt-4">
                Buka Kalkulator
              </Button>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
