import { Globe } from 'lucide-react';
import { useTranslation } from '@/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface Language {
  code: string;
  name: string;
  flag?: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
];

interface LanguageSelectorProps {
  className?: string;
  variant?: 'button' | 'icon';
}

/**
 * Language selector component
 * Allows users to switch between available languages
 */
export function LanguageSelector({ className, variant = 'icon' }: LanguageSelectorProps) {
  const { locale, setLocale } = useTranslation();
  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  if (variant === 'button') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={cn(className)}>
            <Globe className="mr-2 h-4 w-4" />
            {currentLanguage.flag} {currentLanguage.name}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLocale(lang.code)}
              className={locale === lang.code ? 'bg-accent' : ''}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
              {locale === lang.code && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn(className)} aria-label="Select language">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={locale === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
            {locale === lang.code && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

