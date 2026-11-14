import { Loading } from '@/components/feedback/States';

// 탭 · 하위 화면으로 넘어갈 때 서버 응답을 기다리지 않고 바로 이 화면으로 바뀐다 (하단 탭은 그대로 남는다)
export default function TabsLoading() {
  return <Loading />;
}
