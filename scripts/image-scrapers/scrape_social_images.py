#!/usr/bin/env python3
"""
Social Media Image Scraper
Scrapes images from Reddit, Twitter/X, Pinterest WITHOUT API keys

Usage:
    python scrape_social_images.py "Paris France" --max-images 20
    python scrape_social_images.py "Tokyo Japan" --platforms reddit pinterest
"""

import json
import sys
import argparse
from typing import List, Dict
import requests
from datetime import datetime

def scrape_reddit_images(query: str, max_images: int = 20) -> List[Dict]:
    """
    Scrape images from Reddit using public JSON API (NO API KEY!)
    """
    images = []
    
    # Photography subreddits
    subreddits = [
        'itookapicture',
        'travelphotography', 
        'earthporn',
        'cityporn',
        'villageporn',
        'architectureporn'
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; TravelBlogr/1.0)'
    }
    
    for subreddit in subreddits:
        if len(images) >= max_images:
            break
            
        try:
            # Reddit's public JSON API
            url = f'https://www.reddit.com/r/{subreddit}/search.json'
            params = {
                'q': query,
                'restrict_sr': '1',
                'sort': 'top',
                'limit': 25
            }
            
            print(f'🔍 Searching r/{subreddit}...', file=sys.stderr)
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code != 200:
                print(f'⚠️  r/{subreddit}: HTTP {response.status_code}', file=sys.stderr)
                continue
                
            data = response.json()
            posts = data.get('data', {}).get('children', [])
            
            for post in posts:
                if len(images) >= max_images:
                    break
                    
                post_data = post.get('data', {})
                url = post_data.get('url', '')
                
                # Check if it's an image
                is_image = (
                    url.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')) or
                    'i.redd.it' in url or
                    'i.imgur.com' in url
                )
                
                if not is_image:
                    continue
                    
                # Filter out memes/selfies
                title = post_data.get('title', '').lower()
                exclude = ['meme', 'funny', 'joke', 'selfie', 'my face']
                if any(kw in title for kw in exclude):
                    continue
                    
                images.append({
                    'url': url,
                    'title': post_data.get('title'),
                    'author': post_data.get('author'),
                    'author_url': f"https://reddit.com/u/{post_data.get('author')}",
                    'platform': 'Reddit',
                    'score': post_data.get('score', 0),
                    'timestamp': datetime.fromtimestamp(post_data.get('created_utc', 0)).isoformat(),
                    'source_url': f"https://reddit.com{post_data.get('permalink')}"
                })
                
            print(f'✅ r/{subreddit}: Found {len(images)} images total', file=sys.stderr)
            
        except Exception as e:
            print(f'❌ r/{subreddit}: {str(e)}', file=sys.stderr)
            continue
    
    return images


def scrape_pinterest_images(query: str, max_images: int = 20) -> List[Dict]:
    """
    Scrape images from Pinterest using public endpoints (NO API KEY!)
    """
    images = []
    
    try:
        # Pinterest's public search endpoint
        url = 'https://www.pinterest.com/resource/BaseSearchResource/get/'
        params = {
            'source_url': f'/search/pins/?q={query}',
            'data': json.dumps({
                'options': {
                    'query': query,
                    'scope': 'pins'
                },
                'context': {}
            })
        }
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; TravelBlogr/1.0)',
            'Accept': 'application/json'
        }
        
        print(f'🔍 Searching Pinterest...', file=sys.stderr)
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        if response.status_code != 200:
            print(f'⚠️  Pinterest: HTTP {response.status_code}', file=sys.stderr)
            return images
            
        data = response.json()
        pins = data.get('resource_response', {}).get('data', {}).get('results', [])
        
        for pin in pins[:max_images]:
            # Get highest quality image
            image_url = (
                pin.get('images', {}).get('orig', {}).get('url') or
                pin.get('images', {}).get('736x', {}).get('url') or
                pin.get('images', {}).get('564x', {}).get('url')
            )
            
            if not image_url:
                continue
                
            images.append({
                'url': image_url,
                'title': pin.get('title') or pin.get('grid_title'),
                'author': pin.get('pinner', {}).get('username'),
                'author_url': pin.get('pinner', {}).get('profile_url'),
                'platform': 'Pinterest',
                'score': pin.get('aggregated_pin_data', {}).get('aggregated_stats', {}).get('saves', 0),
                'source_url': f"https://www.pinterest.com/pin/{pin.get('id')}/"
            })
            
        print(f'✅ Pinterest: Found {len(images)} images', file=sys.stderr)
        
    except Exception as e:
        print(f'❌ Pinterest: {str(e)}', file=sys.stderr)
    
    return images


def scrape_flickr_images(query: str, max_images: int = 20) -> List[Dict]:
    """
    Scrape images from Flickr using public feed (NO API KEY!)
    """
    images = []
    
    try:
        # Flickr's public feed
        url = 'https://www.flickr.com/services/feeds/photos_public.gne'
        params = {
            'tags': query,
            'format': 'json',
            'nojsoncallback': 1
        }
        
        print(f'🔍 Searching Flickr...', file=sys.stderr)
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code != 200:
            print(f'⚠️  Flickr: HTTP {response.status_code}', file=sys.stderr)
            return images
            
        data = response.json()
        items = data.get('items', [])
        
        for item in items[:max_images]:
            # Get large image URL (_b = large size)
            image_url = item.get('media', {}).get('m', '').replace('_m.jpg', '_b.jpg')
            
            if not image_url:
                continue
                
            # Extract author from "nobody@flickr.com (username)"
            author = item.get('author', '')
            if '(' in author and ')' in author:
                author = author.split('(')[1].split(')')[0]
                
            images.append({
                'url': image_url,
                'title': item.get('title'),
                'author': author,
                'author_url': item.get('author_url'),
                'platform': 'Flickr',
                'timestamp': item.get('published'),
                'source_url': item.get('link')
            })
            
        print(f'✅ Flickr: Found {len(images)} images', file=sys.stderr)
        
    except Exception as e:
        print(f'❌ Flickr: {str(e)}', file=sys.stderr)
    
    return images


def main():
    parser = argparse.ArgumentParser(description='Scrape images from social media without API keys')
    parser.add_argument('query', help='Search query (e.g., "Paris France")')
    parser.add_argument('--max-images', type=int, default=20, help='Max images per platform')
    parser.add_argument('--platforms', nargs='+', default=['reddit', 'pinterest', 'flickr'],
                       choices=['reddit', 'pinterest', 'flickr'],
                       help='Platforms to scrape')
    
    args = parser.parse_args()
    
    all_images = []
    
    if 'reddit' in args.platforms:
        all_images.extend(scrape_reddit_images(args.query, args.max_images))
        
    if 'pinterest' in args.platforms:
        all_images.extend(scrape_pinterest_images(args.query, args.max_images))
        
    if 'flickr' in args.platforms:
        all_images.extend(scrape_flickr_images(args.query, args.max_images))
    
    # Sort by score
    all_images.sort(key=lambda x: x.get('score', 0), reverse=True)
    
    # Output JSON to stdout
    print(json.dumps({
        'query': args.query,
        'total_images': len(all_images),
        'images': all_images
    }, indent=2))
    
    print(f'\n✅ Total: {len(all_images)} images', file=sys.stderr)


if __name__ == '__main__':
    main()

