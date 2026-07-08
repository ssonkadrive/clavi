'use client'

interface ChatRoom {
  id: string
  name: string
  lastMessage: string
  unread: boolean
}

const mockChats: ChatRoom[] = []

export default function InstructorMessagesPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">채팅</h1>

      <div className="space-y-2">
        {mockChats.map(chat => (
          <div
            key={chat.id}
            className={`p-4 rounded-lg border flex justify-between items-center cursor-pointer ${
              chat.unread ? 'bg-blue-50 border-blue-200' : 'bg-white'
            }`}
          >
            <div>
              <p className="font-bold">{chat.name}</p>
              <p className="text-sm text-gray-500">{chat.lastMessage}</p>
            </div>
            {chat.unread && (
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
