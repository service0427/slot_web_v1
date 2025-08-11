import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SlotService } from '@/services/slotService';
import { useMutation } from '@tanstack/react-query';
import type { CreateSlotParams, SlotCategory, WorkType } from '@/types/slot.types';

export default function SlotCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateSlotParams>({
    slot_name: '',
    description: '',
    category: 'basic',
    work_type: 'other',
    price: 0,
    duration_days: 7,
    max_workers: 1,
  });

  // 슬롯 생성
  const createMutation = useMutation({
    mutationFn: (data: CreateSlotParams) => SlotService.createSlot(data),
    onSuccess: (newSlot) => {
      alert('슬롯이 생성되었습니다.');
      navigate(`/slots/${newSlot.id}`);
    },
    onError: (error: any) => {
      alert(error.message || '슬롯 생성에 실패했습니다.');
    },
  });

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!formData.slot_name.trim()) {
      alert('슬롯 이름을 입력해주세요.');
      return;
    }
    
    if (formData.price <= 0) {
      alert('가격은 0보다 커야 합니다.');
      return;
    }
    
    if (formData.duration_days <= 0) {
      alert('작업 기간은 1일 이상이어야 합니다.');
      return;
    }
    
    if (formData.max_workers <= 0) {
      alert('최대 작업자 수는 1명 이상이어야 합니다.');
      return;
    }

    createMutation.mutate(formData);
  };

  // 가격 포맷팅
  const formatPrice = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, '') || '0');
    return num;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/slots')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>
        <h1 className="text-3xl font-bold">새 슬롯 만들기</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 기본 정보 */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="slot_name">슬롯 이름 *</Label>
                  <Input
                    id="slot_name"
                    placeholder="예: 웹사이트 번역 프로젝트"
                    value={formData.slot_name}
                    onChange={(e) => setFormData({ ...formData, slot_name: e.target.value })}
                    maxLength={255}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.slot_name.length}/255
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    placeholder="프로젝트에 대한 상세한 설명을 작성해주세요."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">카테고리 *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as SlotCategory })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">기본</SelectItem>
                        <SelectItem value="premium">프리미엄</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="special">특별</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      카테고리에 따라 수수료가 다를 수 있습니다.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="work_type">작업 타입 *</Label>
                    <Select
                      value={formData.work_type}
                      onValueChange={(value) => setFormData({ ...formData, work_type: value as WorkType })}
                    >
                      <SelectTrigger id="work_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="translation">번역</SelectItem>
                        <SelectItem value="design">디자인</SelectItem>
                        <SelectItem value="development">개발</SelectItem>
                        <SelectItem value="content">콘텐츠</SelectItem>
                        <SelectItem value="marketing">마케팅</SelectItem>
                        <SelectItem value="other">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration_days">작업 기간 (일) *</Label>
                    <Input
                      id="duration_days"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      1일 ~ 365일
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="max_workers">최대 작업자 수 *</Label>
                    <Input
                      id="max_workers"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.max_workers}
                      onChange={(e) => setFormData({ ...formData, max_workers: parseInt(e.target.value) || 1 })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      1명 ~ 100명
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 가격 및 옵션 */}
          <div>
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">가격 설정</h2>
              
              <div>
                <Label htmlFor="price">가격 (원) *</Label>
                <Input
                  id="price"
                  type="text"
                  placeholder="0"
                  value={formData.price === 0 ? '' : formData.price.toLocaleString()}
                  onChange={(e) => setFormData({ ...formData, price: formatPrice(e.target.value) })}
                />
                <div className="mt-2 text-2xl font-bold text-blue-600">
                  ₩{formData.price.toLocaleString()}
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-semibold mb-1">가격 책정 가이드</p>
                    <ul className="space-y-1">
                      <li>• 기본: ₩10,000 ~ ₩100,000</li>
                      <li>• 프리미엄: ₩100,000 ~ ₩500,000</li>
                      <li>• VIP: ₩500,000 이상</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">추가 옵션</h2>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">긴급 작업 가능</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">포트폴리오 공개 허용</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">NDA(기밀유지계약) 필요</span>
                </label>
              </div>
            </Card>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/slots')}>
            취소
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending ? '생성 중...' : '슬롯 생성'}
          </Button>
        </div>
      </form>
    </div>
  );
}