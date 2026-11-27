import { ImageResponse } from 'next/og';

export const alt = 'QuestOS: turn goals into campaigns and run them on a parchment quest board';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** The default link preview for every page. Built at build time; no network. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#170e0a',
        color: '#f7efd2',
        border: '16px solid #332219',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          marginBottom: 40,
          border: '4px solid rgba(217, 119, 6, 0.5)',
          borderRadius: 12,
          color: '#f59e0b',
          fontSize: 72,
          fontWeight: 700,
        }}
      >
        Q
      </div>
      <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: 8, color: '#f59e0b' }}>QUESTOS</div>
      <div style={{ marginTop: 16, fontSize: 32, letterSpacing: 6, color: '#d97706' }}>TURN GOALS INTO LEGENDS</div>
      <div style={{ marginTop: 48, fontSize: 30, color: '#d6d3d1' }}>
        Forge a campaign, let the AI Oracle plan the quests, run them on the board.
      </div>
    </div>,
    size
  );
}
