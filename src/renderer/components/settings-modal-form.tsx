import React, {
  ChangeEvent,
  FC,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cloneDeep, set } from 'lodash';
import Select from 'react-select';

import { sqlectron } from '../api';
import Checkbox from './checkbox';
import { mapObjectToConfig } from '../utils/config';
import type { BaseConfig, Config } from '../../common/types/config';
import { ConfigState } from '../reducers/config';

const logLevelOptions = [
  { value: 'debug', label: 'Debug', icon: 'bug' },
  { value: 'info', label: 'Info', icon: 'info' },
  { value: 'warn', label: 'Warn', icon: 'warning sign' },
  { value: 'error', label: 'Error', icon: 'remove circle' },
];

const errorLogLevelOption = logLevelOptions.find((l) => l.value === 'error');

interface Props {
  onSaveClick: (config: BaseConfig) => void;
  onCancelClick: () => void;
  config: ConfigState;
  // TODO: hook up to render
  error: Error | null;
}

const renderLogLevelItem = ({ label, icon }) => {
  return (
    <span>
      <i className={`icon ${icon}`} /> {label}
    </span>
  );
};

const SettingsModalForm: FC<Props> = ({ onSaveClick, onCancelClick, config }) => {
  const [configState, setConfigState] = useState(cloneDeep(config.data as Config));

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modalRef.current) {
      return;
    }
    const elem = modalRef.current;
    $(elem)
      .modal({
        closable: true,
        detachable: false,
        allowMultiple: true,
        observeChanges: true,
        onHidden: () => {
          onCancelClick();
          return true;
        },
        onDeny: (): void => {
          onCancelClick();
        },
        onApprove: (): false => false,
      })
      .modal('show');

    return () => {
      $(elem).modal('hide');
    };
  }, [modalRef, onCancelClick]);

  const handleChange = useCallback(
    (
      event:
        | ChangeEvent<HTMLInputElement>
        | { persist?: null; target: { files?: null; name: string; value: boolean; type?: null } },
    ) => {
      if (event.persist) {
        event.persist();
      }
      const newState = cloneDeep(configState || {}) as Config;
      const { target } = event;
      const value = target.files ? target.files[0].path : target.value;
      const name = target.name.replace(/^file\./, '');
      const [name1, name2] = name.split('.');

      if (name1 && name2) {
        newState[name1] = { ...newState[name1] };
      }

      set(
        newState,
        name,
        typeof value === 'string' && typeof target.type === 'string'
          ? target.type === 'range'
            ? Number.parseFloat(value)
            : Number.parseInt(value, 10)
          : value,
      );
      setConfigState(newState);
    },
    [configState],
  );

  const handleLogLevelChange = useCallback(
    (level: { value: string }) => {
      setConfigState({ ...configState, log: { ...configState.log, level: level.value } });
    },
    [configState],
  );

  const handleSaveClick = useCallback(() => {
    onSaveClick(mapObjectToConfig(configState));
  }, [configState, onSaveClick]);

  const onDocClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    sqlectron.browser.shell.openExternal(
      'https://github.com/sqlectron/sqlectron-gui/blob/master/docs/app/configuration-file.md',
    );
  };

  const handleSetConfigState = useCallback(
    (newValues: Partial<Config>) => {
      setConfigState({ ...configState, ...newValues });
    },
    [configState],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const highlightError = useCallback((name: string): string => {
    // TODO: figure what to do with this
    // I'm not really certain what the original intention is here, as `error` is always just a regular
    // Error object, and so does not have a `log` property. This should probably validate the fields on
    // input change, as well as if `onSaveClick` fails in some way?
    /*
    let hasError = !!(error && error[name]);
    if (error && error.log && /^log\./.test(name)) {
      const logErrors = error.log[0].errors[0];
      const lastName = name.replace(/^log\./, '');
      hasError = !!~Object.keys(logErrors).indexOf(lastName);
    }
    return hasError ? 'error' : '';
    */
    return '';
  }, []);

  const zoomFactor = configState.zoomFactor || 1;
  const zoomFactorLabel = `${Math.round(zoomFactor * 100)}%`;
  const log = configState.log || {};

  return (
    <div id="settings-modal" className="ui modal" ref={modalRef}>
      <div className="header">Settings</div>
      <div className="content">
        <form className="ui form">
          <div>
            <div className="two fields">
              <div className={`field ${highlightError('zoomFactor')}`}>
                <label>
                  Zoom Factor:
                  {zoomFactorLabel}
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="3"
                  step="0.2"
                  name="zoomFactor"
                  value={zoomFactor}
                  onChange={handleChange}
                  style={{ width: '100%', marginTop: '10px' }}
                />
              </div>
              <div className={`field ${highlightError('limitQueryDefaultSelectTop')}`}>
                <label>Limit of Rows from Select Top Query</label>
                <input
                  type="number"
                  name="limitQueryDefaultSelectTop"
                  value={configState.limitQueryDefaultSelectTop || ''}
                  onChange={handleChange}
                />
                <p className="help">
                  The limit used in the default select from the sidebar context menu.
                </p>
              </div>
            </div>

            <div className="ui segment">
              <div className="one field">UI Preferences</div>
              <div>
                <div className="three fields">
                  <div className="field">
                    <Checkbox
                      name="enabledDarkTheme"
                      label="Dark Theme"
                      checked={configState.enabledDarkTheme}
                      onChecked={() => handleSetConfigState({ enabledDarkTheme: true })}
                      onUnchecked={() => handleSetConfigState({ enabledDarkTheme: false })}
                    />
                    <p className="help">Enable/Disable dark theme.</p>
                  </div>
                  <div className="field">
                    <Checkbox
                      name="connectionsAsList"
                      label="List Connections"
                      checked={configState.connectionsAsList}
                      onChecked={() => handleSetConfigState({ connectionsAsList: true })}
                      onUnchecked={() => handleSetConfigState({ connectionsAsList: false })}
                    />
                    <p className="help">Display saved connections as a list instead of cards.</p>
                  </div>
                </div>
                <div>
                  <div className="one fields">
                    <div className={`field ${highlightError('customFont')}`}>
                      <label>Custom Font</label>
                      <input
                        type="text"
                        name="customFont"
                        value={configState.customFont || 'Consolas'}
                        onChange={handleChange}
                      />
                      <p className="help">
                        Use a custom font for in-app text and display. Font must be installed to
                        use.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      <div className="actions">
        <div className="small ui black deny right labeled icon button" tabIndex={0}>
          Cancel
          <i className="ban icon" />
        </div>
        <div
          className="small ui green right labeled icon button"
          tabIndex={0}
          onClick={handleSaveClick}>
          Save
          <i className="checkmark icon" />
        </div>
      </div>
    </div>
  );
};

SettingsModalForm.displayName = 'SettingsModalForm';
export default SettingsModalForm;
