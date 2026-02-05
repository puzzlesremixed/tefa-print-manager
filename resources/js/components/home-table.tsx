export default function HomeTable() {
  return (
    <>
      <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/30 p-5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-600"></div>
            <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-800 uppercase">
              ANTRIAN SAAT INI
            </h3>
          </div>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-black text-indigo-700">
            13 PESANAN
          </span>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-auto">
          <table className="h-full w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="px-6 py-4 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Pelanggan
                </th>
                <th className="px-6 py-4 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Dokumen
                </th>
                <th className="px-6 py-4 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Status & Progres
                </th>
                <th className="px-6 py-4 text-right text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="mb-2 scale-150 text-slate-200"></div>
                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                      Antrian Sedang Kosong
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
