import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="auth-page">
      {/* Left: Branding Panel */}
      <div className="auth-left">
        <div className="auth-bg-gradient" />
        <div className="auth-bg-particles">
          <div className="auth-particle auth-particle-1" />
          <div className="auth-particle auth-particle-2" />
          <div className="auth-particle auth-particle-3" />
        </div>

        <div className="auth-brand-content">
          <div className="auth-logo">
            <div className="auth-logo-icon">N</div>
            <div className="auth-logo-text">
              <h1>NovaX</h1>
              <span>AI Voice Platform</span>
            </div>
          </div>

          <h2 className="auth-tagline">
            Tạo tài khoản<br />
            <span className="auth-tagline-gradient">miễn phí ngay hôm nay</span>
          </h2>

          <p className="auth-description">
            Đăng ký để trải nghiệm sức mạnh AI Text-to-Speech và Voice Cloning.
            Bắt đầu với 2.5 triệu ký tự miễn phí.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">🎙️</div>
              <div>
                <strong>30+ giọng nói AI</strong>
                <span>Đa ngôn ngữ, tự nhiên</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🧬</div>
              <div>
                <strong>Nhân bản giọng nói</strong>
                <span>Clone giọng nói của bạn bằng AI</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">⚡</div>
              <div>
                <strong>Xử lý nhanh chóng</strong>
                <span>Tạo audio trong vài giây</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-footer-text">
          © 2026 NovaX. All rights reserved.
        </div>
      </div>

      {/* Right: Clerk Sign-Up Form */}
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            appearance={{
              elements: {
                rootBox: { width: '100%', maxWidth: '420px' },
                card: {
                  background: 'rgba(20, 23, 38, 0.85)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                },
                headerTitle: { color: '#f1f5f9' },
                headerSubtitle: { color: '#94a3b8' },
                formFieldLabel: { color: '#94a3b8' },
                formFieldInput: {
                  background: 'rgba(20, 23, 38, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9',
                  borderRadius: '10px',
                },
                formButtonPrimary: {
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  borderRadius: '10px',
                },
                footerActionLink: { color: '#a78bfa' },
                identityPreviewEditButton: { color: '#a78bfa' },
                formFieldInputShowPasswordButton: { color: '#94a3b8' },
                dividerLine: { background: 'rgba(255,255,255,0.08)' },
                dividerText: { color: '#64748b' },
                socialButtonsBlockButton: {
                  background: 'rgba(20, 23, 38, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9',
                  borderRadius: '10px',
                },
                socialButtonsBlockButtonText: { color: '#f1f5f9' },
                footerAction: { color: '#94a3b8' },
                alertText: { color: '#f1f5f9' },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
