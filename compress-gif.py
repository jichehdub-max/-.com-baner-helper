#!/usr/bin/env python3
"""
GIF Compressor - Сжатие GIF файлов для загрузки на итд.com

Использование:
    python compress-gif.py input.gif output.gif [--quality 80] [--max-size 10]
    
Параметры:
    --quality    Качество (1-100, по умолчанию 80)
    --max-size   Максимальный размер в МБ (по умолчанию 10)
    --width      Максимальная ширина (опционально)
    --height     Максимальная высота (опционально)
    --fps        Кадров в секунду (опционально, уменьшает FPS)
"""

import sys
import os
import argparse
from PIL import Image, ImageSequence
import subprocess

def get_file_size_mb(filepath):
    """Получить размер файла в МБ"""
    return os.path.getsize(filepath) / (1024 * 1024)

def compress_gif_pillow(input_path, output_path, quality=80, max_width=None, max_height=None, reduce_fps=None):
    """
    Сжать GIF используя Pillow
    
    Args:
        input_path: путь к входному GIF
        output_path: путь к выходному GIF
        quality: качество (1-100)
        max_width: максимальная ширина
        max_height: максимальная высота
        reduce_fps: уменьшить FPS (например, 2 = каждый второй кадр)
    """
    print(f"📂 Открываю {input_path}...")
    img = Image.open(input_path)
    
    # Получить информацию о GIF
    original_size = get_file_size_mb(input_path)
    frame_count = getattr(img, 'n_frames', 1)
    width, height = img.size
    
    print(f"📊 Оригинал: {width}x{height}, {frame_count} кадров, {original_size:.2f} МБ")
    
    # Вычислить новый размер если нужно
    new_width, new_height = width, height
    if max_width and width > max_width:
        new_height = int(height * (max_width / width))
        new_width = max_width
    if max_height and new_height > max_height:
        new_width = int(new_width * (max_height / new_height))
        new_height = max_height
    
    if new_width != width or new_height != height:
        print(f"📐 Изменяю размер до {new_width}x{new_height}")
    
    # Обработать кадры
    frames = []
    durations = []
    frame_index = 0
    
    print(f"🎬 Обрабатываю кадры...")
    for frame in ImageSequence.Iterator(img):
        # Получить длительность кадра
        frame_duration = frame.info.get('duration', 100)
        
        # Пропустить кадры если нужно уменьшить FPS
        if reduce_fps and frame_index % reduce_fps != 0:
            frame_index += 1
            # Если пропускаем кадр - добавить его длительность к следующему
            if len(durations) > 0:
                durations[-1] += frame_duration
            continue
        
        # Конвертировать в RGB если нужно
        if frame.mode not in ('RGB', 'RGBA', 'P'):
            frame = frame.convert('RGBA')
        
        # Изменить размер
        if new_width != width or new_height != height:
            frame = frame.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Оптимизировать палитру
        if frame.mode == 'RGBA':
            # Конвертировать RGBA в P (палитра) с прозрачностью
            alpha = frame.split()[-1]
            frame = frame.convert('RGB').convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
            frame.info['transparency'] = 255
        elif frame.mode == 'RGB':
            frame = frame.convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
        
        frames.append(frame)
        durations.append(frame_duration)
        frame_index += 1
    
    # Убедиться что длина durations совпадает с frames
    if len(durations) != len(frames):
        print(f"⚠️  Корректирую длительности кадров...")
        # Если не совпадает - использовать среднюю длительность
        avg_duration = sum(durations) // len(durations) if durations else 100
        durations = [avg_duration] * len(frames)
    
    print(f"💾 Сохраняю {len(frames)} кадров...")
    
    # Вычислить среднюю длительность кадра
    avg_duration = sum(durations) // len(durations) if durations else 100
    
    print(f"⏱️  Средняя длительность кадра: {avg_duration}ms")
    
    # Сохранить GIF с одинаковой длительностью для всех кадров
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=avg_duration,  # Одна длительность для всех кадров
        loop=0,
        optimize=True,
        quality=quality
    )
    
    compressed_size = get_file_size_mb(output_path)
    compression_ratio = (1 - compressed_size / original_size) * 100
    
    print(f"✅ Готово!")
    print(f"📊 Результат: {new_width}x{new_height}, {len(frames)} кадров, {compressed_size:.2f} МБ")
    print(f"📉 Сжатие: {compression_ratio:.1f}%")
    
    return compressed_size

def compress_gif_gifsicle(input_path, output_path, optimization_level=3):
    """
    Сжать GIF используя gifsicle (если установлен)
    
    Args:
        input_path: путь к входному GIF
        output_path: путь к выходному GIF
        optimization_level: уровень оптимизации (1-3)
    """
    try:
        print(f"🔧 Дополнительная оптимизация с gifsicle...")
        subprocess.run([
            'gifsicle',
            f'-O{optimization_level}',
            '--colors', '256',
            input_path,
            '-o', output_path
        ], check=True, capture_output=True)
        
        compressed_size = get_file_size_mb(output_path)
        print(f"✅ Gifsicle оптимизация завершена: {compressed_size:.2f} МБ")
        return True
    except FileNotFoundError:
        print("⚠️  gifsicle не установлен, пропускаю дополнительную оптимизацию")
        print("   Установите: brew install gifsicle (macOS) или apt install gifsicle (Linux)")
        return False
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Ошибка gifsicle: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description='Сжатие GIF файлов для загрузки на итд.com',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры:
  python compress-gif.py input.gif output.gif
  python compress-gif.py input.gif output.gif --quality 70 --max-size 5
  python compress-gif.py input.gif output.gif --width 800 --fps 2
        """
    )
    
    parser.add_argument('input', help='Входной GIF файл')
    parser.add_argument('output', help='Выходной GIF файл')
    parser.add_argument('--quality', type=int, default=80, help='Качество (1-100, по умолчанию 80)')
    parser.add_argument('--max-size', type=float, default=10, help='Максимальный размер в МБ (по умолчанию 10)')
    parser.add_argument('--width', type=int, help='Максимальная ширина')
    parser.add_argument('--height', type=int, help='Максимальная высота')
    parser.add_argument('--fps', type=int, help='Уменьшить FPS (2 = каждый второй кадр, 3 = каждый третий)')
    parser.add_argument('--no-gifsicle', action='store_true', help='Не использовать gifsicle')
    
    args = parser.parse_args()
    
    # Проверить входной файл
    if not os.path.exists(args.input):
        print(f"❌ Ошибка: файл {args.input} не найден")
        sys.exit(1)
    
    print("=" * 60)
    print("🎨 GIF Compressor для итд.com")
    print("=" * 60)
    
    # Сжать с помощью Pillow
    temp_output = args.output + '.temp.gif' if not args.no_gifsicle else args.output
    
    compressed_size = compress_gif_pillow(
        args.input,
        temp_output,
        quality=args.quality,
        max_width=args.width,
        max_height=args.height,
        reduce_fps=args.fps
    )
    
    # Дополнительная оптимизация с gifsicle
    if not args.no_gifsicle:
        if compress_gif_gifsicle(temp_output, args.output):
            os.remove(temp_output)
            compressed_size = get_file_size_mb(args.output)
        else:
            # Если gifsicle не сработал - использовать результат Pillow
            os.rename(temp_output, args.output)
    
    # Проверить размер
    if compressed_size > args.max_size:
        print(f"\n⚠️  Предупреждение: размер {compressed_size:.2f} МБ превышает лимит {args.max_size} МБ")
        print(f"   Попробуйте:")
        print(f"   - Уменьшить качество: --quality 60")
        print(f"   - Уменьшить размер: --width 600")
        print(f"   - Уменьшить FPS: --fps 2")
    else:
        print(f"\n✅ Размер {compressed_size:.2f} МБ в пределах лимита {args.max_size} МБ")
    
    print(f"\n📁 Сохранено: {args.output}")
    print("=" * 60)

if __name__ == '__main__':
    main()
