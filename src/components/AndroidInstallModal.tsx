import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  X,
  ExternalLink,
  Layers,
  Terminal,
  FileCode,
  ShieldCheck,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'install' | 'apk'>('install');
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const copyCapacitorCommands = () => {
    const text = `npm run build\nnpx cap add android\nnpx cap sync android\nnpx cap open android`;
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 bg-gradient-to-r from-emerald-600/10 via-transparent to-sky-600/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                تطبيق أندرويد (Android App)
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                  جاهز للتثبيت
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                طريقتان لتشغيل واستخدام التطبيق على هاتف الأندرويد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1.5">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'install'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            التثبيت المباشر على الهاتف (PWA)
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'apk'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            حزمة APK / Android Studio
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {activeTab === 'install' ? (
            <div className="space-y-4">
              {/* App Status Card */}
              {isInstalled ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="font-bold text-sm">التطبيق مثبت حالياً ويعمل كتطبيق مستقل!</h4>
                    <p className="text-xs opacity-90">أنت تستخدم التطبيق بالفعل في وضع ملء الشاشة مع حفظ البيانات بدون إنترنت.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        تثبيت فوري بدون متجر وبدون تحميل ملفات
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                        يتم تنزيل أيقونة التطبيق في شاشة تطبيقات هاتفك مباشرة، ويفتح بدون شريط المتصفح، مع سرعة فائقة وحفظ كامل للبيانات دون الحاجة لشبكة إنترنت.
                      </p>
                    </div>
                  </div>

                  {isInstallable ? (
                    <button
                      onClick={async () => {
                        const success = await install();
                        if (success) onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all transform active:scale-98"
                    >
                      <Download className="w-5 h-5" />
                      تثبيت التطبيق على الأندرويد الآن
                    </button>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div className="text-xs text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800">
                        <p className="font-bold mb-1.5 flex items-center gap-1.5 text-amber-800 dark:text-amber-400">
                          <HelpCircle className="w-4 h-4" />
                          خطوات التثبيت من متصفح هاتف الأندرويد (Chrome):
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                          <li>اضغط على <strong>القائمة (ثلاث نقاط رأسيّة ⋮)</strong> في أعلى أو أسفل المتصفح.</li>
                          <li>اختر <strong>«تثبيت التطبيق» (Install app)</strong> أو <strong>«إضافة إلى الشاشة الرئيسية» (Add to Home screen)</strong>.</li>
                          <li>اضغط موافقة، وستجد أيقونة التطبيق ظهرت فوراً بين تطبيقات هاتفك.</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Benefits list */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    عمل أوفلاين 100%
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    يعمل في المواقع والمخازن بدون تغطية إنترنت.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs mb-1">
                    <Smartphone className="w-4 h-4" />
                    شاشة كاملة
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    تجربة نيتف حقيقية وسلسة بيد واحدة مع الاهتزاز والصوت.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      تصدير كود Android Studio الأصلي (Capacitor)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      تم دمج وإعداد Capacitor في المشروع بالكامل. يمكنك استخراج ملفات أندرويد وفتحها في Android Studio لإنشاء ملف <strong>APK</strong> أو <strong>AAB</strong> لمتجر جوجل بلاي.
                    </p>
                  </div>
                </div>

                {/* Commands */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      أوامر الإنشاء السريع لملف APK:
                    </span>
                    <button
                      onClick={copyCapacitorCommands}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                    >
                      {copiedCmd ? 'تم النسخ بنجاح ✓' : 'نسخ الأوامر'}
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-400 ltr text-left overflow-x-auto border border-slate-800">
                    <code>
                      npm run build<br />
                      npx cap add android<br />
                      npx cap sync android<br />
                      npx cap open android
                    </code>
                  </div>
                </div>

                {/* Bubblewrap TWA option */}
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs space-y-1">
                  <p className="font-bold text-blue-800 dark:text-blue-300">
                    طريقة ثانية: استخدام PWABuilder (أسهل طريقة لإنشاء APK أونلاين):
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    يمكنك وضع رابط التطبيق المنشور في موقع <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">PWABuilder.com</a> والضغط على "Generate Android Package" لتنزيل ملف APK فوراً بضغطة زر دون الحاجة لتثبيت أي برامج على جهازك!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            حِصر • إصدار الأندرويد v1.0.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
