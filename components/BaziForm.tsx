import React, { useState, useMemo } from 'react';
import { UserInput, Gender } from '../types';
import { Loader2, Sparkles, TrendingUp, Calculator, AlertCircle } from 'lucide-react';
import { Solar } from 'lunar-javascript';

interface BaziFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

const BaziForm: React.FC<BaziFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<UserInput>({
    name: '',
    gender: Gender.MALE,
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthHour: '',
    yearPillar: '',
    monthPillar: '',
    dayPillar: '',
    hourPillar: '',
    startAge: '',
    firstDaYun: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateBaZi = () => {
    const { birthYear, birthMonth, birthDay, birthHour, gender } = formData;
    
    // 基础校验
    if (!birthYear || !birthMonth || !birthDay || birthHour === '') {
      alert("请填写完整的出生年月日时（阳历）");
      return;
    }

    try {
      const year = parseInt(birthYear);
      const month = parseInt(birthMonth);
      const day = parseInt(birthDay);
      const hour = parseInt(birthHour);

      // 1. 初始化 Solar (阳历) 对象
      const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
      
      // 2. 转为 Lunar (阴历) 对象
      const lunar = solar.getLunar();
      
      // 3. 获取八字 (EightChar) 对象
      const eightChar = lunar.getEightChar();

      // 4. 计算四柱 (Four Pillars)
      // 修正：EightChar 对象的方法是 getYear(), getMonth(), getDay(), getTime()
      // 它们返回的已经是干支字符串（如 "甲子"）
      const yearPillar = eightChar.getYear();
      const monthPillar = eightChar.getMonth();
      const dayPillar = eightChar.getDay();
      const hourPillar = eightChar.getTime();

      // 5. 计算大运 (Da Yun)
      // Gender: 1 for Male, 0 for Female in lunar-javascript
      const genderNum = gender === Gender.MALE ? 1 : 0;
      const yun = eightChar.getYun(genderNum);
      
      // 获取大运列表
      const daYunArr = yun.getDaYun();
      
      // 通常 Index 1 是第一步正式大运 (Index 0 是起运前的童限)
      if (daYunArr.length > 1) {
        const firstDaYunObj = daYunArr[1];
        const firstDaYun = firstDaYunObj.getGanZhi();
        const startAge = firstDaYunObj.getStartAge(); // 获取起运年龄(虚岁)

        setFormData(prev => ({
          ...prev,
          yearPillar,
          monthPillar,
          dayPillar,
          hourPillar,
          startAge: startAge.toString(),
          firstDaYun
        }));
      } else {
        // 极少数情况可能无法计算大运
        setFormData(prev => ({
          ...prev,
          yearPillar,
          monthPillar,
          dayPillar,
          hourPillar,
          startAge: '1', 
          firstDaYun: ''
        }));
        alert("八字排盘成功，但大运计算异常，请手动检查");
      }

    } catch (e) {
      console.error("排盘失败详情:", e);
      alert(`自动排盘失败: ${(e as Error).message}。请检查控制台了解详情。`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.yearPillar || !formData.firstDaYun) {
      alert("请先进行自动排盘或手动填写四柱信息");
      return;
    }
    onSubmit(formData);
  };

  // Calculate direction for UI feedback
  const daYunDirectionInfo = useMemo(() => {
    if (!formData.yearPillar) return '等待排盘...';
    
    const firstChar = formData.yearPillar.trim().charAt(0);
    const yinStems = ['乙', '丁', '己', '辛', '癸'];
    
    let isYangYear = true; // default assume Yang if unknown
    if (yinStems.includes(firstChar)) isYangYear = false;
    
    let isForward = false;
    if (formData.gender === Gender.MALE) {
      isForward = isYangYear; // Male Yang = Forward, Male Yin = Backward
    } else {
      isForward = !isYangYear; // Female Yin = Forward, Female Yang = Backward
    }
    
    return isForward ? '顺行 (阳男/阴女)' : '逆行 (阴男/阳女)';
  }, [formData.yearPillar, formData.gender]);

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-serif-sc font-bold text-gray-800 mb-2">八字排盘</h2>
        <p className="text-gray-500 text-sm">请输入出生信息，点击“自动排盘”</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Name & Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">姓名 (可选)</label>
             <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
              placeholder="姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: Gender.MALE })}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${
                  formData.gender === Gender.MALE
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                乾造 (男)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: Gender.FEMALE })}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${
                  formData.gender === Gender.FEMALE
                    ? 'bg-white text-pink-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                坤造 (女)
              </button>
            </div>
          </div>
        </div>

        {/* Date Input Section */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2 text-blue-800 text-sm font-bold">
               <Calculator className="w-4 h-4" />
               <span>出生时间 (阳历)</span>
             </div>
             <button
               type="button"
               onClick={calculateBaZi}
               className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition shadow-sm font-bold flex items-center gap-1"
             >
               自动排盘 <Sparkles className="w-3 h-3" />
             </button>
           </div>
           
           <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <input
                  type="number"
                  name="birthYear"
                  required
                  min="1900"
                  max="2100"
                  value={formData.birthYear}
                  onChange={handleChange}
                  placeholder="年 (1990)"
                  className="w-full px-2 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-sm text-center font-bold"
                />
              </div>
              <div>
                <input
                  type="number"
                  name="birthMonth"
                  required
                  min="1"
                  max="12"
                  value={formData.birthMonth}
                  onChange={handleChange}
                  placeholder="月"
                  className="w-full px-2 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-sm text-center font-bold"
                />
              </div>
              <div>
                <input
                  type="number"
                  name="birthDay"
                  required
                  min="1"
                  max="31"
                  value={formData.birthDay}
                  onChange={handleChange}
                  placeholder="日"
                  className="w-full px-2 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-sm text-center font-bold"
                />
              </div>
           </div>
           <div className="mt-2 flex items-center gap-2">
             <input
                type="number"
                name="birthHour"
                required
                min="0"
                max="23"
                value={formData.birthHour}
                onChange={handleChange}
                placeholder="时 (0-23)"
                className="w-1/3 px-2 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-sm text-center font-bold"
             />
             <div className="flex-1 text-[10px] text-blue-500 leading-tight">
               <AlertCircle className="w-3 h-3 inline mr-1" />
               填入24小时制数字<br/>系统自动处理早晚子时
             </div>
           </div>
        </div>

        {/* Four Pillars Output (ReadOnly or Editable) */}
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
          <div className="flex items-center gap-2 mb-3 text-amber-800 text-sm font-bold">
            <Sparkles className="w-4 h-4" />
            <span>四柱信息 (自动生成)</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 text-center">年柱</label>
              <input
                type="text"
                name="yearPillar"
                required
                value={formData.yearPillar}
                onChange={handleChange}
                placeholder="-"
                className="w-full px-1 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold text-gray-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 text-center">月柱</label>
              <input
                type="text"
                name="monthPillar"
                required
                value={formData.monthPillar}
                onChange={handleChange}
                placeholder="-"
                className="w-full px-1 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold text-gray-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 text-center">日柱</label>
              <input
                type="text"
                name="dayPillar"
                required
                value={formData.dayPillar}
                onChange={handleChange}
                placeholder="-"
                className="w-full px-1 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold text-gray-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 text-center">时柱</label>
              <input
                type="text"
                name="hourPillar"
                required
                value={formData.hourPillar}
                onChange={handleChange}
                placeholder="-"
                className="w-full px-1 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Da Yun Output */}
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-2 mb-3 text-indigo-800 text-sm font-bold">
            <TrendingUp className="w-4 h-4" />
            <span>大运信息 (自动生成)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">起运年龄 (虚岁)</label>
              <input
                type="text"
                name="startAge"
                required
                value={formData.startAge}
                onChange={handleChange}
                placeholder="-"
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-bold text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">第一步大运</label>
              <input
                type="text"
                name="firstDaYun"
                required
                value={formData.firstDaYun}
                onChange={handleChange}
                placeholder="-"
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-serif-sc font-bold text-gray-900"
              />
            </div>
          </div>
           <p className="text-xs text-indigo-600/70 mt-2 text-center">
             当前大运排序规则：
             <span className="font-bold text-indigo-900">{daYunDirectionInfo}</span>
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-900 to-gray-900 hover:from-black hover:to-black text-white font-bold py-3.5 rounded-xl shadow-lg transform transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>大师推演中(3-5分钟)</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-amber-300" />
              <span>生成人生K线</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default BaziForm;