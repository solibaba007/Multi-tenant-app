import * as React from 'react'

interface InviteEmailProps {
  invitedByEmail?: string
  teamName: string
  inviteUrl: string
}

export const InviteEmail: React.FC<InviteEmailProps> = ({
  invitedByEmail,
  teamName,
  inviteUrl,
}) => (
  <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '500px' }}>
    <h2 style={{ color: '#111827', marginTop: 0 }}>You've been invited to join {teamName}</h2>
    <p style={{ color: '#4B5563', fontSize: '16px', lineHeight: '1.5' }}>
      {invitedByEmail ? <strong>{invitedByEmail}</strong> : 'A team member'} has invited you to collaborate on <strong>{teamName}</strong>.
    </p>
    <div style={{ margin: '32px 0' }}>
      <a
        href={inviteUrl}
        style={{
          backgroundColor: '#2563EB',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 'bold',
          display: 'inline-block',
        }}
      >
        Accept Invitation
      </a>
    </div>
    <p style={{ color: '#9CA3AF', fontSize: '12px' }}>
      If you weren't expecting this invitation, you can safely ignore this email.
    </p>
  </div>
)