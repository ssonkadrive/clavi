'use client'

import { useState } from 'react'
import ProfileTab from './components/ProfileTab'
import SkillsTab from './components/SkillsTab'
import EducationTab from './components/EducationTab'
import VerificationTab from './components/VerificationTab'

type TabType = 'profile' | 'skills' | 'education' | 'verification'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  const tabs = [
    { id: 'profile' as TabType, label: '👤 프로필', icon: '👤' },
    { id: 'skills' as TabType, label: '💡 역량', icon: '💡' },
    { id: 'education' as TabType, label: '📚 학력', icon: '📚' },
    { id: 'verification' as TabType, label: '⚖️ 신원검증', icon: '⚖️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">프로필 관리</h1>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.icon}</span>
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'skills' && <SkillsTab />}
          {activeTab === 'education' && <EducationTab />}
          {activeTab === 'verification' && <VerificationTab />}
        </div>
      </div>
    </div>
  )
}
