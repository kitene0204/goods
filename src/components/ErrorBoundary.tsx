import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    if (window.confirm('저장된 로컬 데이터를 초기화하고 기본 샘플 데이터로 복구하시겠습니까?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white tracking-tight">화면 로딩 중 오류가 발생했습니다</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                일시적인 데이터 형식 문제일 수 있습니다. 아래 버튼을 눌러 새로고침하거나 안전하게 기본 데이터로 복구할 수 있습니다.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950 text-left overflow-x-auto text-[11px] font-mono text-rose-300 border border-slate-800">
                {this.state.error.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>새로고침</span>
              </button>
              <button
                onClick={this.handleResetData}
                className="py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>데이터 초기화</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
