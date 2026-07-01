import type * as React from 'react';
import type { SystemProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import type { InputBaseProps } from '@mui/material/InputBase';
import type { InputLabelProps } from '@mui/material/InputLabel';
import type { PaperProps } from '@mui/material/Paper';
import type { TypographyProps } from '@mui/material/Typography';

type LegacySystemProps = Omit<Partial<SystemProps<Theme>>, 'color' | 'position'>;

declare module '@mui/material/OverridableComponent' {
  interface CommonProps extends LegacySystemProps {}
}

declare module '@mui/system/Box' {
  interface BoxOwnProps<Theme extends object = {}> extends Partial<SystemProps<Theme>> {}
}

declare module '@mui/material/TextField' {
  interface BaseTextFieldProps {
    InputProps?: Partial<InputBaseProps>;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>;
    InputLabelProps?: Partial<InputLabelProps>;
  }
}

declare module '@mui/material/ListItemText' {
  interface ListItemTextProps {
    primaryTypographyProps?: Partial<TypographyProps>;
    secondaryTypographyProps?: Partial<TypographyProps>;
  }
}

declare module '@mui/material/Menu' {
  interface MenuProps {
    PaperProps?: Partial<PaperProps>;
  }
}

declare module '@mui/material/Dialog' {
  interface DialogProps {
    PaperProps?: Partial<PaperProps>;
  }
}

declare module '@mui/material/Grid' {
  interface GridBaseProps extends LegacySystemProps {
    item?: boolean;
    xs?: number | 'auto' | false;
    sm?: number | 'auto' | false;
    md?: number | 'auto' | false;
    lg?: number | 'auto' | false;
    xl?: number | 'auto' | false;
  }
}
