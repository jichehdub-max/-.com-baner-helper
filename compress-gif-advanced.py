#!/usr/bin/env python3
"""
Advanced GIF Compressor - Лучшее сжатие через ffmpeg и gifsicle

Использование:
    python compress-gif-advanced.py input.gif output.gif [--quality 80] [--fps 15]
"""

import sys
import os
import argparse
import subprocess
import tempfile

def get_file_size_mb(filepath):
    """Получить размер файла в МБ"""
    return os.path.getsize(filepath) / (1024 * 1024)

def check_dependencies():
    """Проверить установлены ли ffmpeg и gifsicle"""
    deps = {}
    
    # Проверить ffmpeg
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        deps['ffmpeg'] = True
    except (FileNotFoundError, subprocess.CalledProcessError):
        deps['ffmpeg'] = False
    
    # Проверить gifsicle
    try:
        subprocess.run(['gifsicle', '--version'], capture_output=True, check=True)
        deps['gifsicle'] = True
    except (FileNotFoundError, subprocess.CalledProcessError):
        deps['gifsicle'] = False
    
    return deps

def compress_with_ffmpeg(input_path, output_path, fps=15, width=None, quality=80):
    """
    Сжать GIF через ffmpeg (лучшее качество)
    
    Args:
        input_path: входной GIF
        output_path: выходной GIF
        fps: кадров в секунду
        width: ширина (None = оригинал)
        quality: качество (1-100)
    """
    print(f"🎬 Сжимаю через ffmpeg...")
    
    # Построить фильтр
    filters = []
    filters.append(f'fps={fps}')
    
    if width:
        filters.append(f'scale={width}:-1:flags=lanczos')
    else:
        filters.append('scale=iw:ih:flags=lanczos')
    
    # Палитра для лучшего качества
    filters.append('split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5')
    
    filter_str = ','.join(filters)
    
    try:
        subprocess.run([
            'ffmpeg',
            '-i', input_path,
            '-vf', filter_str,
            '-y',  # перезаписать
            output_path
        ], check=True, capture_output=True, text=True)
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Ошибка ffmpeg: {e.stderr}")
        return False

def compress_with_gifsicle(input_path, output_path, optimization=3, colors=256, lossy=None):
    """
    Дополнительная оптимизация через gifsicle
    
    Args:
        input_path: входной GIF
        output_path: выходной GIF
        optimization: уровень оптимизации (1-3)
        colors: количество цветов (2-256)
        lossy: уровень lossy сжатия (None или 20-200)
    """
    print(f"🔧 Оптимизирую через gifsicle...")
    
    cmd = [
        'gifsicle',
        f'-O{optimization}',
        '--colors', str(colors),
    ]
    
    if lossy:
        cmd.extend(['--lossy=' + str(lossy)])
    
    cmd.extend([input_path, '-o', output_path])
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Ошибка gifsicle: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description='Advanced GIF Compressor с ffmpeg и gifsicle',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры:
  python compress-gif-advanced.py input.gif output.gif
  python compress-gif-advanced.py input.gif output.gif --fps 10 --width 600
  python compress-gif-advanced.py input.gif output.gif --quality 60 --lossy 80
        """
    )
    
    parser.add_argument('input', help='Входной GIF файл')
    parser.add_argument('output', help='Выходной GIF файл')
    parser.add_argument('--fps', type=int, default=15, help='Кадров в секунду (по умолчанию 15)')
    parser.add_argument('--width', type=int, help='Ширина (по умолчанию оригинал)')
    parser.add_argument('--quality', type=int, default=80, help='Качество 1-100 (по умолчанию 80)')
    parser.add_argument('--colors', type=int, default=256, help='Количество цветов (по умолчанию 256)')
    parser.add_argument('--lossy', type=int, help='Lossy сжатие 20-200 (опционально)')
    parser.add_argument('--max-size', type=float, default=10, help='Целевой размер в МБ')
    
    args = parser.parse_args()
    
    # Проверить входной файл
    if not os.path.exists(args.input):
        print(f"❌ Ошибка: файл {args.input} не найден")
        sys.exit(1)
    
    # Проверить зависимости
    deps = check_dependencies()
    
    print("=" * 60)
    print("🎨 Advanced GIF Compressor")
    print("=" * 60)
    
    if not deps['ffmpeg']:
        print("❌ ffmpeg не установлен!")
        print("   Установите: https://ffmpeg.org/download.html")
        print("   Windows: choco install ffmpeg")
        print("   macOS: brew install ffmpeg")
        sys.exit(1)
    
    original_size = get_file_size_mb(args.input)
    print(f"📊 Оригинал: {original_size:.2f} МБ")
    
    # Создать временный файл
    temp_file = tempfile.NamedTemporaryFile(suffix='.gif', delete=False)
    temp_path = temp_file.name
    temp_file.close()
    
    try:
        # Шаг 1: Сжать через ffmpeg
        success = compress_with_ffmpeg(
            args.input,
            temp_path,
            fps=args.fps,
            width=args.width,
            quality=args.quality
        )
        
        if not success:
            print("❌ Не удалось сжать через ffmpeg")
            sys.exit(1)
        
        ffmpeg_size = get_file_size_mb(temp_path)
        print(f"✅ После ffmpeg: {ffmpeg_size:.2f} МБ ({(1 - ffmpeg_size/original_size)*100:.1f}% сжатие)")
        
        # Шаг 2: Дополнительная оптимизация через gifsicle (если установлен)
        if deps['gifsicle']:
            success = compress_with_gifsicle(
                temp_path,
                args.output,
                optimization=3,
                colors=args.colors,
                lossy=args.lossy
            )
            
            if success:
                final_size = get_file_size_mb(args.output)
                print(f"✅ После gifsicle: {final_size:.2f} МБ ({(1 - final_size/original_size)*100:.1f}% сжатие)")
            else:
                # Если gifsicle не сработал - использовать результат ffmpeg
                os.rename(temp_path, args.output)
                final_size = ffmpeg_size
        else:
            print("⚠️  gifsicle не установлен, пропускаю дополнительную оптимизацию")
            os.rename(temp_path, args.output)
            final_size = ffmpeg_size
        
        # Итоги
        print("\n" + "=" * 60)
        print(f"📁 Сохранено: {args.output}")
        print(f"📊 Размер: {original_size:.2f} МБ → {final_size:.2f} МБ")
        print(f"📉 Сжатие: {(1 - final_size/original_size)*100:.1f}%")
        
        if final_size > args.max_size:
            print(f"\n⚠️  Размер {final_size:.2f} МБ превышает лимит {args.max_size} МБ")
            print(f"   Попробуйте:")
            print(f"   --fps {max(5, args.fps - 5)} (меньше FPS)")
            print(f"   --width {args.width - 100 if args.width else 600} (меньше размер)")
            print(f"   --lossy 80 (lossy сжатие)")
        else:
            print(f"✅ Размер в пределах лимита {args.max_size} МБ")
        
        print("=" * 60)
        
    finally:
        # Удалить временный файл
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    main()
