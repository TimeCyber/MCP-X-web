import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useLanguage } from '../contexts/LanguageContext';

interface InfoRow {
  type: string;
  purpose: string;
  method: string;
  scope: string;
}

const InfoTable: React.FC<{
  headers: { type: string; purpose: string; method: string; scope: string };
  rows: InfoRow[];
}> = ({ headers, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-gray-300 border-collapse">
      <thead>
        <tr className="border-b border-gray-700">
          <th className="text-left py-3 pr-4 font-semibold text-white whitespace-nowrap">{headers.type}</th>
          <th className="text-left py-3 pr-4 font-semibold text-white">{headers.purpose}</th>
          <th className="text-left py-3 pr-4 font-semibold text-white">{headers.method}</th>
          <th className="text-left py-3 font-semibold text-white">{headers.scope}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-b border-gray-800 align-top">
            <td className="py-3 pr-4 font-medium text-orange-400 whitespace-nowrap">{row.type}</td>
            <td className="py-3 pr-4">{row.purpose}</td>
            <td className="py-3 pr-4">{row.method}</td>
            <td className="py-3">{row.scope}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const PrivacyPage: React.FC = () => {
  const { t } = useLanguage();

  const tableHeaders = {
    type: t('privacy.infoType'),
    purpose: t('privacy.collectPurpose'),
    method: t('privacy.collectMethod'),
    scope: t('privacy.collectScope'),
  };

  const mobileAppRows: InfoRow[] = [
    {
      type: t('privacy.oaidType'),
      purpose: t('privacy.oaidPurpose'),
      method: t('privacy.oaidMethod'),
      scope: t('privacy.oaidScope'),
    },
    {
      type: t('privacy.androidIdType'),
      purpose: t('privacy.androidIdPurpose'),
      method: t('privacy.androidIdMethod'),
      scope: t('privacy.androidIdScope'),
    },
    {
      type: t('privacy.locationType'),
      purpose: t('privacy.locationPurpose'),
      method: t('privacy.locationMethod'),
      scope: t('privacy.locationScope'),
    },
  ];

  const adscopeRows: InfoRow[] = [
    {
      type: t('privacy.oaidType'),
      purpose: t('privacy.adscopeOaidPurpose'),
      method: t('privacy.adscopeOaidMethod'),
      scope: t('privacy.adscopeOaidScope'),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">{t('privacy.title')}</h1>

          <div className="prose prose-invert">
            <div className="bg-gray-900 rounded-lg p-8 mb-8">
              <p className="text-gray-300 mb-4">{t('privacy.lastUpdated')}</p>
              <p className="text-gray-300">{t('privacy.intro')}</p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('privacy.infoWeCollect')}</h2>
              <div className="bg-gray-900 rounded-lg p-6 space-y-4">
                <p className="text-gray-300">{t('privacy.infoWeCollectDesc')}</p>
                <ul className="list-disc list-inside text-gray-300">
                  <li>{t('privacy.accountInfo')}</li>
                  <li>{t('privacy.profileInfo')}</li>
                  <li>{t('privacy.serverDocs')}</li>
                  <li>{t('privacy.commPrefs')}</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('privacy.mobileAppInfo')}</h2>
              <div className="bg-gray-900 rounded-lg p-6 space-y-4">
                <p className="text-gray-300">{t('privacy.mobileAppInfoDesc')}</p>
                <InfoTable headers={tableHeaders} rows={mobileAppRows} />
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('privacy.thirdPartySDK')}</h2>
              <div className="bg-gray-900 rounded-lg p-6 space-y-6">
                <p className="text-gray-300">{t('privacy.thirdPartySDKDesc')}</p>
                <div>
                  <h3 className="text-lg font-semibold text-orange-400 mb-1">{t('privacy.adscopeSDK')}</h3>
                  <p className="text-gray-400 text-sm mb-4">{t('privacy.adscopeProvider')}</p>
                  <InfoTable headers={tableHeaders} rows={adscopeRows} />
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('privacy.howWeUse')}</h2>
              <div className="bg-gray-900 rounded-lg p-6 space-y-4">
                <p className="text-gray-300">{t('privacy.howWeUseDesc')}</p>
                <ul className="list-disc list-inside text-gray-300">
                  <li>{t('privacy.howWeUseProvide')}</li>
                  <li>{t('privacy.howWeUseTransaction')}</li>
                  <li>{t('privacy.howWeUseNotice')}</li>
                  <li>{t('privacy.howWeUseRespond')}</li>
                  <li>{t('privacy.howWeUseImprove')}</li>
                  <li>{t('privacy.howWeUseAd')}</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('privacy.dataSecurity')}</h2>
              <div className="bg-gray-900 rounded-lg p-6">
                <p className="text-gray-300">{t('privacy.dataSecurityDesc')}</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('privacy.yourRights')}</h2>
              <div className="bg-gray-900 rounded-lg p-6 space-y-4">
                <p className="text-gray-300">{t('privacy.yourRightsDesc')}</p>
                <ul className="list-disc list-inside text-gray-300">
                  <li>{t('privacy.rightAccess')}</li>
                  <li>{t('privacy.rightCorrect')}</li>
                  <li>{t('privacy.rightDelete')}</li>
                  <li>{t('privacy.rightObject')}</li>
                  <li>{t('privacy.rightWithdraw')}</li>
                  <li>{t('privacy.rightClosePermission')}</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">{t('privacy.contactUs')}</h2>
              <div className="bg-gray-900 rounded-lg p-6">
                <p className="text-gray-300">
                  {t('privacy.contactUsDesc')}{' '}
                  <a href="mailto:business@timecyber.com.cn" className="text-orange-500 hover:text-orange-400">
                    business@timecyber.com.cn
                  </a>
                  {t('privacy.contactUsEmail')}
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
