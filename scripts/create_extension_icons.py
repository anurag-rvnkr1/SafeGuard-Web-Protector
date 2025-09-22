#!/usr/bin/env python3
"""
Create Chrome extension icons for Safeguard
"""

import os
from pathlib import Path

def create_simple_icons():
    """Create simple placeholder icons"""
    print("🎨 Creating Chrome extension icons...")
    
    icons_dir = Path("chrome-extension/icons")
    icons_dir.mkdir(exist_ok=True)
    
    # Create simple SVG icons and convert to PNG if PIL is available
    icon_sizes = [16, 48, 128]
    
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        for size in icon_sizes:
            # Active icon (green shield)
            img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            # Draw shield shape
            shield_color = (16, 185, 129, 255)  # Green
            points = [
                (size//4, size//8),
                (3*size//4, size//8),
                (3*size//4, size//2),
                (size//2, 7*size//8),
                (size//4, size//2)
            ]
            draw.polygon(points, fill=shield_color)
            
            # Add checkmark
            check_color = (255, 255, 255, 255)
            check_points = [
                (size//3, size//2),
                (size//2, 2*size//3),
                (2*size//3, size//3)
            ]
            draw.line(check_points, fill=check_color, width=max(1, size//16))
            
            img.save(icons_dir / f"icon{size}.png")
            
            # Disabled icon (gray shield)
            img_disabled = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            draw_disabled = ImageDraw.Draw(img_disabled)
            
            # Draw gray shield
            disabled_color = (156, 163, 175, 255)  # Gray
            draw_disabled.polygon(points, fill=disabled_color)
            
            # Add X mark
            x_color = (255, 255, 255, 255)
            line_width = max(1, size//16)
            draw_disabled.line([(size//3, size//3), (2*size//3, 2*size//3)], fill=x_color, width=line_width)
            draw_disabled.line([(2*size//3, size//3), (size//3, 2*size//3)], fill=x_color, width=line_width)
            
            img_disabled.save(icons_dir / f"icon{size}-disabled.png")
        
        print("  ✅ PNG icons created successfully")
        
    except ImportError:
        print("  ⚠️ PIL not available, creating placeholder files...")
        # Create empty placeholder files
        for size in icon_sizes:
            (icons_dir / f"icon{size}.png").touch()
            (icons_dir / f"icon{size}-disabled.png").touch()
        print("  ✅ Placeholder icon files created")

if __name__ == "__main__":
    create_simple_icons()
