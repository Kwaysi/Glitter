import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import catchify from 'catchify';
import Typography from '@material-ui/core/Typography';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import * as StyledAppPaper from '@ui/components/AppPaper/AppPaper.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  loadDevelopmentWidget,
  unloadDevelopmentWidget,
  toggleDevelopmentWidgetActive,
} from '@ui/api/widgetLoader';
import { useStore } from '@ui/store/hooks';
import { Notification } from '@ui/notifications/store';
import { useStore as useNotificationsStore } from '@ui/notifications/hooks';
import * as Styled from './DevelopmentWidget.css';

interface DevelopmentWidgetInterface {
  path: string;
  title: string;
  subtitle?: string;
  type: string;
  description?: string;
  logs: string[];
  id: string;
  active: boolean;
}

const DevelopmentWidget: React.FC<DevelopmentWidgetInterface> = observer(
  ({ path, title, subtitle, type, description, logs = [], id, active }) => {
    const recognizedTypes = ['vue', 'react'];
    const icon = type === 'vue' ? 'vuejs' : 'react';
    const settingsButton = React.createRef<HTMLButtonElement>();
    const [
      settingsMenuAnchorEl,
      setSettingsMenuAnchorEl,
    ] = useState<null | HTMLElement>(null);
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
    const onSettingsButtonClick = (
      event: React.MouseEvent<HTMLButtonElement>,
    ): void => {
      setSettingsMenuAnchorEl(event.currentTarget);
      setSettingsMenuOpen(true);
    };
    const onClose = (): void => {
      setSettingsMenuOpen(false);
      setSettingsMenuAnchorEl(null);
    };
    const store = useStore();
    const notificationsStore = useNotificationsStore();
    const updateWidget = async (): Promise<void> => {
      const [updatedWidgetError, updatedWidget]: [
        Error,
        { success: boolean; message?: string },
      ] = await catchify(loadDevelopmentWidget({ path }));

      if (updatedWidgetError) {
        notificationsStore.addNotification(
          Notification.create({
            text: updatedWidgetError.message,
            type: 'error',
          }),
        );
        return;
      }

      if (updatedWidget.success === false) {
        notificationsStore.addNotification(
          Notification.create({
            text: updatedWidget.message as string,
            type: 'error',
          }),
        );
        return;
      }

      store.listDevelopmentWidgets({ silent: true });

      notificationsStore.addNotification(
        Notification.create({
          text: 'Widget successfully updated',
          type: 'success',
        }),
      );
    };
    const removeWidget = async (): Promise<void> => {
      const [unloadedWidgetError, unloadedWidget]: [
        Error,
        { success: boolean; message?: string },
      ] = await catchify(unloadDevelopmentWidget({ id }));

      if (unloadedWidgetError) {
        notificationsStore.addNotification(
          Notification.create({
            text: unloadedWidgetError.message,
            type: 'error',
          }),
        );
        return;
      }

      if (unloadedWidget.success === false) {
        notificationsStore.addNotification(
          Notification.create({
            text: unloadedWidget.message as string,
            type: 'error',
          }),
        );
        return;
      }

      store.listDevelopmentWidgets({ silent: true });

      notificationsStore.addNotification(
        Notification.create({
          text: 'Widget successfully unloaded',
          type: 'success',
        }),
      );
    };

    // Logs
    const [logsDialogOpen, setLogsDialogOpen] = useState(false);

    const openLogsDialog = (): void => {
      setLogsDialogOpen(true);
    };
    const closeLogsDialog = (): void => {
      setLogsDialogOpen(false);
    };

    // Activity toggle
    const activateWidget = async (): void => {
      await toggleDevelopmentWidgetActive({ id, active: true });
      store.listDevelopmentWidgets({ silent: true });
    };
    const deactivateWidget = async (): void => {
      await toggleDevelopmentWidgetActive({ id, active: false });
      store.listDevelopmentWidgets({ silent: true });
    };
    const onActivityToggle = (
      event: React.ChangeEvent<HTMLInputElement>,
    ): void => {
      if (event.target.checked) {
        activateWidget();
        return;
      }

      deactivateWidget();
    };

    return (
      <Styled.DevelopmentWidget>
        <Styled.DevelopmentWidgetCard>
          <CardHeader
            avatar={
              recognizedTypes.includes(type) && (
                <Styled.WidgetIcon type={type}>
                  <FontAwesomeIcon icon={['fab', icon] as IconProp} />
                </Styled.WidgetIcon>
              )
            }
            action={
              <Styled.WidgetSettingsButton
                onClick={onSettingsButtonClick}
                ref={settingsButton}
              >
                <FontAwesomeIcon icon={['fas', 'ellipsis-v'] as IconProp} />
              </Styled.WidgetSettingsButton>
            }
            title={title}
            subheader={subtitle}
          />
          <Menu
            anchorEl={settingsMenuAnchorEl}
            open={settingsMenuOpen}
            onClose={onClose}
          >
            <MenuItem
              onClick={(): void => {
                updateWidget();
                onClose();
              }}
            >
              Reload configuration from disk
            </MenuItem>
            <MenuItem onClick={removeWidget}>Remove widget</MenuItem>
          </Menu>
          <CardContent>
            {description && (
              <Styled.WidgetDescription>
                <Typography variant="body2" component="p">
                  {description}
                </Typography>
              </Styled.WidgetDescription>
            )}
            <FormControlLabel
              label="Development active"
              control={
                <Switch
                  checked={active}
                  onChange={onActivityToggle}
                  value="active"
                />
              }
            />
            {logs.length > 0 && (
              <>
                <Styled.Logs>
                  {logs
                    .slice()
                    .reverse()
                    .slice(0, 2)
                    .join('\n')}
                </Styled.Logs>
                <Styled.LogsSeeAll size="small" onClick={openLogsDialog}>
                  See full logs
                </Styled.LogsSeeAll>
                <Dialog
                  open={logsDialogOpen}
                  onClose={closeLogsDialog}
                  PaperComponent={StyledAppPaper.AppPaper}
                  maxWidth="md"
                  fullWidth
                >
                  <Styled.LogsFullTitle disableTypography>
                    Full logs
                    <Styled.LogsFullNote variant="body2">
                      Latest logs are displayed at the top
                    </Styled.LogsFullNote>
                  </Styled.LogsFullTitle>
                  <DialogContent>
                    <Styled.LogsFull>
                      {logs
                        .slice()
                        .reverse()
                        .slice(0, 200)
                        .join('\n')}
                    </Styled.LogsFull>
                  </DialogContent>
                </Dialog>
              </>
            )}
            {logs.length === 0 && (
              <Typography variant="body2">
                There are no logs for this widget
              </Typography>
            )}
          </CardContent>
        </Styled.DevelopmentWidgetCard>
      </Styled.DevelopmentWidget>
    );
  },
);

DevelopmentWidget.propTypes = {
  path: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  type: PropTypes.string.isRequired,
  description: PropTypes.string,
  logs: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  id: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
};

export default DevelopmentWidget;
